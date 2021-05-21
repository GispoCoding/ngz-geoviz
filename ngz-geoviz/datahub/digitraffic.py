import datetime
import glob
import gzip
import json
import logging
import os
import shutil
import time
from ast import literal_eval

import pandas as pd
import requests
from django.conf import settings
from django.contrib.gis.geos import LineString
from django.urls import reverse

from .models import Vessel, Train, VesselStatistics, TrainStatistics
from .mqtt_loader import MqttLoader

logger = logging.getLogger(__name__)


class DigitrafficFetcher:
    name = ""
    headers = []

    def __init__(self):
        self.digitraffic_settings = settings.DIGITRAFFIC
        self.settings = self.get_settings()
        self.data_dir = settings.DATA_DIR
        self.loader = MqttLoader(id_prefix=VesselFetcher.name, on_json_message=self.on_message,
                                 **self.get_mqtt_settings())
        self.csv_file = None

    def get_settings(self):
        return self.digitraffic_settings.get(self.name)

    def get_mqtt_settings(self):
        return self.settings.get("mqtt")

    def start(self):
        self.loader.connect()

    def initialize_output_file(self):
        self.csv_file = os.path.join(settings.DATA_DIR,
                                     f"{datetime.datetime.now().strftime('%Y%m%d_%H%M')}_{self.name}.csv")

    def on_message(self, data):
        try:
            row = self.prepare_row(data)
            if row is not None:
                self.initialize_output_file()
                with open(self.csv_file, "a") as f:
                    f.write(row + "\n")
        except Exception:
            logger.exception("Error occurred during writing messages to the file")
            raise

    def prepare_row(self, data):
        raise ValueError("This method must be overridden")


class VesselFetcher(DigitrafficFetcher):
    name = "VESSELS"
    headers = ["coordinates", "mmsi", "sog", "cog", "navStat", "rot", "posAcc", "raim", "heading"]

    def __init__(self):
        super().__init__()

    def prepare_row(self, data):
        coordinates = data["geometry"]["coordinates"]
        coordinates.append(data["properties"]["timestampExternal"])
        props = data["properties"]
        props["coordinates"] = literal_eval("[{:.3f}, {:.3f}, {:d}]".format(*data["geometry"]["coordinates"]))
        row = ";".join(str(props[key]) for key in self.headers)
        return row


class TrainFetcher(DigitrafficFetcher):
    name = "TRAINS"
    headers = ["trainNumber", "trainCategory", "coordinates", "speed"]
    TRAIN_NUMBERS = "train_numbers"
    GRAPHQL_TEMPLATE = '''
    {
      trainsByDepartureDate(departureDate: "{date}", 
        where: {trainType: {trainCategory: {name: {equals: "{category}"}}}} 
        ) {
        trainNumber
        trainType {
          trainCategory {
            name
          }
        }
      }
    }
    '''

    def __init__(self):
        super().__init__()

    def get_settings(self):
        initial_settings = super().get_settings()
        initial_settings[TrainFetcher.TRAIN_NUMBERS] = dict()
        url = initial_settings.get("graphql_url")
        for category in initial_settings.get("train_categories"):
            data = {
                'query': (self.GRAPHQL_TEMPLATE.replace("{category}", category)
                          .replace("{date}", datetime.datetime.now().strftime('%Y-%m-%d'))
                          .replace("\n", ""))
            }
            # logger.debug(f"Query string: {json.dumps(data)}")

            r = requests.post(url, json=json.loads(json.dumps(data)))
            if r.ok:
                train_data = json.loads(r.text)["data"]["trainsByDepartureDate"]
                train_numbers = {int(train["trainNumber"]): train["trainType"]["trainCategory"]["name"] for train in train_data}
                initial_settings[TrainFetcher.TRAIN_NUMBERS].update(train_numbers)

            else:
                logger.warning(f"Response from digitraffic train data was not ok {r.text}")

        return initial_settings

    def prepare_row(self, data):
        '''
        :param data: {"trainNumber":66,"departureDate":"2020-02-17","timestamp":"2020-02-17T09:29:50.000Z","location":{"type":"Point","coordinates":[27.627167,62.880533]},"speed":88}
        :return: csv row or None
        '''
        row = None
        try:
            category = self.settings[TrainFetcher.TRAIN_NUMBERS].get(data["trainNumber"], None)
            if category is not None:
                timestamp = datetime.datetime.strptime(data["timestamp"], "%Y-%m-%dT%H:%M:%S.000Z")
                timestamp = int(timestamp.timestamp() * 1000)
                coordinates = data["location"]["coordinates"]
                data["trainCategory"] = category
                coordinates.append(timestamp)
                data["coordinates"] = literal_eval("[{:.3f}, {:.3f}, {:d}]".format(*coordinates))
                row = ";".join(str(data[key]) for key in self.headers)
        except Exception:
            logger.exception(f"Error occurred with data: {data}")
        return row


class DigitrafficSaver:
    pk = ""
    name = ""
    headers = []
    fields = []
    model_class = None
    statistics_model_class = None
    metadata_url = ""

    def __init__(self, resample_period, delete_files):
        self.resample_period = resample_period
        self.data_dir = settings.DATA_DIR
        self.delete_files = delete_files

    def populate(self):
        data_files = glob.glob(os.path.join(self.data_dir, f"*_{self.name}.*"))
        if len(data_files):
            df = self.create_dataframe_from_data(data_files).rename(columns={"coordinates": "geojson"})
            for index, row in df.iterrows():
                try:
                    if len(row.geojson) > 1:
                        values = {**{'geojson': LineString(row.geojson)},
                                  **{field: row[field] for field in self.fields}}
                        self.model_class.objects.update_or_create(pk=index,
                                                                  defaults=values)
                except TypeError:
                    logger.exception(f"Error occurred with row {row}, {row.geojson}")

            if self.delete_files:
                for f in data_files:
                    if os.path.isfile(f):
                        os.remove(f)
            current_ids = set(df.index.values)
            self.clean_database(current_ids)
            self.save_statistics(current_ids)

        else:
            logger.debug("No files found")

    def clean_database(self, current_ids):
        # Only delete instances that are old enough without any new input
        period = settings.DIGITRAFFIC.get("PERIOD_HOURS") * 2 * 60 * 60 * 1000
        clean_older = (time.time() - 3600) * 1000 - period

        old_ids = set(
            self.model_class.objects
                .extra(where=['ST_ZMin(geojson) < %s'], params=[clean_older])
                .values_list('pk', flat=True)
        )

        old_ids = old_ids - current_ids

        objects_to_delete = self.model_class.objects.filter(pk__in=old_ids)
        number_of_objects_to_delete = len(objects_to_delete)
        if number_of_objects_to_delete > 0:
            objects_to_delete.delete()
            logger.warning(f"Deleted {number_of_objects_to_delete} objects from class {self.model_class.__name__}")
            logger.debug(f"Deleted ids are: {','.join(map(str, old_ids))}")

    def save_statistics(self, current_ids):
        date = datetime.date.today()
        for obj_id in current_ids:
            self.statistics_model_class.objects.get_or_create(date=date, obj_id=obj_id)

    def create_dataframe_from_data(self, data_files):
        df = pd.concat(map(lambda file: pd.read_csv(file, delimiter=";", header=0, names=self.headers), data_files))

        def parse_coords(coordinates):
            coords = tuple(literal_eval(coordinates))
            # Altitude 0
            # coords.insert(2, 0)
            return coords

        df.coordinates = df.coordinates.apply(parse_coords)

        df["datetime"] = pd.to_datetime(df.coordinates.apply(lambda coords: coords[-1]), unit="ms").dt.round('min')
        df.index = df['datetime']
        del df['datetime']
        # # Group by pk and resample with datetime
        df = self.group_df(df, self.resample_period, key=self.pk)
        metadata = self.get_metadata()
        if metadata is not None:
            df = pd.merge(left=df, right=metadata, on=self.pk, how='left')
            df = df.where(pd.notnull(df), None)
            logger.debug("Metadata merged")
        return df

    def group_df(self, df, resample, key):
        agg_dict = {
            "coordinates": lambda x: [y for y in x]
        }
        cols = filter(lambda x: x not in [key, "coordinates"], list(df.columns))

        agg_dict.update({key: "first" for key in cols})
        df = df.groupby([key, pd.Grouper(freq=resample)]).first().dropna().groupby([key]).agg(agg_dict).dropna()
        return df

    def get_metadata(self):
        '''This should be overridden'''

    def is_ok(self, r):
        if not r.ok:
            logger.warning(f"Response from digitraffic metadata for {self.name} was not ok: {r.text}")
        return r.ok

    def save_cached_file(self):
        logger.debug("Saving cached file")
        url = f"{settings.NGZ_BASE_URL}{reverse(self.name.lower())}"
        r = requests.get(url)
        if self.is_ok(r):
            out_file = f"{self.name.lower()}.csv"
            out_file_gz = f"{out_file}.gz"

            root = os.path.join(settings.DATAHUB_ROOT, "datahub")
            static_root2 = os.path.join(settings.DATAHUB_STATIC, "datahub")
            with open(os.path.join(root, out_file), "w") as f:
                f.write(r.text)
            with open(os.path.join(root, out_file), 'rb') as f_in, gzip.open(os.path.join(root, out_file_gz), 'wb') as f_out:
                f_out.writelines(f_in)
            shutil.copy2(os.path.join(root, out_file), static_root2)
            shutil.copy2(os.path.join(root, out_file_gz), static_root2)


class VesselSaver(DigitrafficSaver):
    pk = "mmsi"
    name = VesselFetcher.name
    headers = VesselFetcher.headers
    model_class = Vessel
    statistics_model_class = VesselStatistics
    fields = ["shipType", "draught", "name"]
    metadata_url = "https://meri.digitraffic.fi/api/v1/metadata/vessels"

    def __init__(self, resample_period, delete_files):
        super().__init__(resample_period, delete_files)

    def get_metadata(self):
        r = requests.get(self.metadata_url)
        if super().is_ok(r):
            data = r.json()
            vessels = {vessel[self.pk]: [vessel[field] for field in self.fields] for vessel in data}
            df = pd.DataFrame.from_dict(vessels, columns=self.fields, orient='index')
            df.index.name = self.pk
            return df
        else:
            return None


class TrainSaver(DigitrafficSaver):
    pk = "trainNumber"
    name = TrainFetcher.name
    headers = TrainFetcher.headers
    model_class = Train
    statistics_model_class = TrainStatistics
    fields = ["trainCategory", "speed"]

    def __init__(self, resample_period, delete_files):
        super().__init__(resample_period, delete_files)

    def get_metadata(self):
        return None

    def group_df(self, df, resample, key):
        agg_dict = {
            "coordinates": lambda x: [y for y in x],
            "speed": lambda x: [y for y in x]
        }
        agg_dict.update({key: "first" for key in
                         (filter(lambda x: x not in [key, "coordinates", "speed"], list(df.columns)))})
        return df.groupby([key, pd.Grouper(freq=resample)]).first().dropna().groupby([key]).agg(agg_dict).dropna()
