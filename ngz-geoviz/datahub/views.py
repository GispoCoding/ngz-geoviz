import datetime
import logging
import time

from django.conf import settings
from django.contrib.staticfiles.views import serve
from django.db.models import Count, F
from django.db.models.functions import TruncWeek
from django.forms.models import model_to_dict
from django.http import JsonResponse
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.gzip import gzip_page
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_gis.fields import GeoJsonDict
from rest_pandas import PandasView

from .models import Vessel, Train, Map, VesselStatistics, TrainStatistics
from .serializers import VesselSerializer, TrainSerializer
from .tasks import load_digitraffic_trains, load_digitraffic_vessels, populate_digitraffic_data
from .test_data import provide_test_geojson

logger = logging.getLogger(__name__)

PERIOD = settings.DIGITRAFFIC.get("PERIOD_HOURS") * 60 * 60 * 1000


class TestView(APIView):
    # from rest_framework.permissions import IsAuthenticated
    # permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(provide_test_geojson())


class DigitrafficView(PandasView):
    queryset = []
    filename = ""
    serializer_class = VesselSerializer

    # Add more categories if needed
    category_other = "Other"
    category_dict = {
        range(31, 32): "Fishing",
        range(60, 70): "Passenger",
        range(70, 80): "Cargo",
        range(80, 90): "Tanker"
    }

    def filter_queryset(self, queryset):
        h24_ago = time.time() * 1000 - PERIOD
        return (queryset
                .extra(where=['ST_ZMax(geojson) >= %s'], params=[h24_ago])
                .extra(select={'npoints': 'ST_NPoints(geojson)'}, where=["ST_NPoints(geojson) >= 3"],
                       order_by=['-npoints'])
                )

    def transform_dataframe(self, df):
        h24_ago = time.time() * 1000 - PERIOD

        def clean_geojson(geojson):
            # Add altitude (0) as third coordinate and make time to int
            geojson["coordinates"] = [[c[0], c[1], 0, int(c[2])] for c in geojson["coordinates"] if c[2] >= h24_ago]
            if len(geojson["coordinates"]) < 3:
                return None
            return GeoJsonDict({'type': 'Feature', 'geometry': geojson})

        def category_dict_lookup(ship_type):
            for ship_type_range in self.category_dict.keys():
                if ship_type in ship_type_range:
                    return self.category_dict[ship_type_range]
            return self.category_other

        df.geojson = df.geojson.apply(clean_geojson)
        df = df.dropna()
        df["category"] = df.shipType.apply(category_dict_lookup)
        return df

    def get_pandas_filename(self, request, format):
        if format == 'csv':
            return self.filename

    @method_decorator(cache_page(settings.DIGITRAFFIC['SCHEDULE'] * 60))
    @method_decorator(gzip_page)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VesselView(DigitrafficView):
    queryset = Vessel.objects.all()
    serializer_class = VesselSerializer
    filename = "vessels"


class TrainView(DigitrafficView):
    queryset = Train.objects.all()
    serializer_class = TrainSerializer
    filename = "trains"

    def transform_dataframe(self, df):
        h24_ago = time.time() * 1000 - PERIOD

        def clean_geojson(row):
            # Add altitude (0) as third coordinate and make time to int
            geojson = row.geojson
            speed = row.speed
            coords = []
            for i, c in enumerate(geojson["coordinates"]):
                try:
                    if c[2] >= h24_ago:
                        coords.append([c[0], c[1], speed[i], int(c[2])])
                except IndexError:
                    coords.append([c[0], c[1], 0, int(c[2])])
            geojson["coordinates"] = coords
            if len(geojson["coordinates"]) < 3:
                return None
            return GeoJsonDict({'type': 'Feature', 'geometry': geojson})

        df.geojson = df.apply(clean_geojson, axis=1)
        df = df.dropna()
        del df['speed']
        return df


class DigitrafficStatisticsView(APIView):
    model = None

    def get(self, request):
        data = list(self.model.objects
                    .filter(date__gte=datetime.datetime.now() - datetime.timedelta(days=7))
                    .values('date')
                    .annotate(y=Count('obj_id'))
                    .annotate(x=F('date'))  # Chart.js understands that it is a time axis
                    .values('x', 'y'))
        return Response(data)


class VesselStatisticsView(DigitrafficStatisticsView):
    model = VesselStatistics


class TrainStatisticsView(DigitrafficStatisticsView):
    model = TrainStatistics


class MapConfigurations(APIView):
    ROOT = settings.NGZ_BASE_URL
    MEDIA_ROOT = '' if settings.USE_S3 else ROOT

    def get(self, request):
        def get_stat_url(stat):
            if stat.is_reverse:
                url = f"{self.ROOT}{reverse(stat.reverse_url)}"
            elif stat.file:
                url = f"{self.MEDIA_ROOT}{stat.file.url}"
            else:
                url = None
            return url

        qs = Map.objects.order_by('order', 'id').prefetch_related('datasets').prefetch_related('statistics')
        config = [{
            'id': map.id,
            'imageUrl': f"{self.MEDIA_ROOT}{map.image.url}",
            'configUrl': f"{self.MEDIA_ROOT}{map.config.url}",
            'readOnly': map.read_only,
            'minZoom': map.min_zoom,
            'maxZoom': map.max_zoom,
            'enabled': map.enabled,
            'details': {
                'fi': model_to_dict(map.details_fi),
                'en': model_to_dict(map.details_en)
            },
            'statistics': [
                {
                    'id': stat.id,
                    'url': get_stat_url(stat),
                    'type': stat.type,
                    'colorHex': stat.colorHex,
                    'labelFi': stat.label_fi,
                    'labelEn': stat.label_en,
                    'timeAxis': stat.time_axis,
                    'inPopup': stat.in_popup,
                    'useData': stat.use_data,
                    'layerId': stat.layer_id,
                    'fieldX': stat.field_x,
                    'fieldY': stat.field_y,
                    'fieldR': stat.field_r,
                    'fieldLabel': stat.field_label
                } for stat in map.statistics.all()],
            'datasets': [{
                'id': dataset.id,
                'label': dataset.label,
                'type': dataset.type,
                'url': f"{self.MEDIA_ROOT}{dataset.file.url}" if dataset.type != 'dt' else f"{self.ROOT}{reverse(dataset.type)}?data={dataset.id}"
            } for dataset in map.datasets.all()]
        } for map in qs]
        return Response(config)


def redirect_to_static_digitraffic_data(request):
    csv_name = request.GET.get('data', None)
    if csv_name is not None:
        return serve(request, f"datahub/{csv_name}.csv")


def redirect_to_static_csv_data(request):
    csv_name = request.GET.get('data', None)
    if csv_name is not None:
        return serve(request, f"datahub/{csv_name}.csv")


def redirect_to_static_json_data(request):
    json_name = request.GET.get('data', None)
    if json_name is not None:
        return serve(request, f"datahub/{json_name}.json")


def start_async_mqtt_loaders(request):
    load_digitraffic_vessels.delay()
    load_digitraffic_trains.delay()
    return JsonResponse({"status": "started!"})


def is_authenticated(request):
    return JsonResponse({"is_authenticated": request.user.is_authenticated})


def populate_digitraffic_models(request):
    populate_digitraffic_data.delay(resample_period=settings.DIGITRAFFIC.get("RESAMPLE_PERIOD"))
    return JsonResponse({"status": "started populating!"})
