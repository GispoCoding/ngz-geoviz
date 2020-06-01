import logging

from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.gis.geos import LineString
from django.contrib.postgres.fields import ArrayField
# Create your models here.
from django_pandas.managers import DataFrameManager

logger = logging.getLogger(__name__)


class DigitrafficCommon(models.Model):
    geojson = models.LineStringField(dim=3, srid=4326)

    # Non-model fields
    objects = DataFrameManager()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.old_geojson = self.geojson
        self.period = settings.DIGITRAFFIC.get("PERIOD_HOURS") * 60 * 60 * 1000

    def filter_geojson(self):
        created = not self.pk

        # Join line with previous one
        if not created and self.old_geojson != self.geojson:
            self.geojson = self.old_geojson + self.geojson

        # Filter based on period
        if self.geojson.z[-1] - self.geojson.z[0] >= self.period:
            for i in range(len(self.geojson)):
                if self.geojson.z[-1] - self.geojson.z[i] <= self.period:
                    if len(self.geojson) - i > 2:
                        self.geojson = LineString(self.geojson[i:])
                    break

    class Meta:
        abstract = True


class Vessel(DigitrafficCommon):
    mmsi = models.IntegerField(unique=True, primary_key=True)
    name = models.CharField(max_length=100, null=True)
    shipType = models.IntegerField(null=True)
    draught = models.IntegerField(null=True)

    # Unfortunately this API does not show all vessels... https://meri.digitraffic.fi/api/v1/metadata/vessel-details
    # name_prefix = models.CharField(max_length=20)
    # type_name = models.CharField(max_length=20)
    # #https://en.wikipedia.org/wiki/Gross_tonnage
    # cross_tonnage = models.IntegerField()
    # #https://en.wikipedia.org/wiki/Net_tonnage
    # net_tonnage = models.IntegerField()
    # #https://en.wikipedia.org/wiki/Deadweight_tonnage
    # deadweight = models.IntegerField()
    # length = models.FloatField()

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        self.filter_geojson()
        super().save(force_insert, force_update, using, update_fields)


class VesselStatistics(models.Model):
    obj_id = models.IntegerField()
    date = models.DateField()


class Train(DigitrafficCommon):
    trainNumber = models.IntegerField(unique=True, primary_key=True)
    trainCategory = models.CharField(max_length=20)
    # LineString does not support 4th dimension yet, otherwise this could be added there
    speed = ArrayField(models.IntegerField(), blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.speeds_old = self.speed

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        self.filter_geojson()
        self.filter_speeds()
        super().save(force_insert, force_update, using, update_fields)

    def filter_speeds(self):
        created = not self.pk
        # Join speeds
        if not created and self.speed != self.speeds_old:
            self.speed = self.speeds_old + self.speed

        # Filter based on geojson period
        if len(self.speed) > len(self.geojson):
            self.speed = self.speed[-(len(self.geojson)):]

class TrainStatistics(models.Model):
    obj_id = models.IntegerField()
    date = models.DateField()


class Dataset(models.Model):
    id = models.CharField(unique=True, primary_key=True, max_length=20)
    file = models.FileField(null=True, blank=True)
    label = models.CharField(null=True, max_length=500)
    type = models.CharField(null=True, max_length=10)

    def __str__(self):
        return self.id


class Details(models.Model):
    label = models.CharField(max_length=200)
    detail = models.TextField(blank=True)
    desc = models.TextField(blank=True)
    dataurl = models.URLField(max_length=1000)

    class Meta:
        abstract = True


class DetailsFi(Details):

    def __str__(self):
        return f"fi: {self.label}"


class DetailsEn(Details):

    def __str__(self):
        return f"en: {self.label}"

class StatisticsFile(models.Model):
    id = models.CharField(unique=True, primary_key=True, max_length=20)
    type = models.CharField(max_length=100, blank=True, default="")
    label_fi = models.CharField(max_length=100, blank=True, default="")
    label_en = models.CharField(max_length=100, blank=True, default="")
    colorHex = models.CharField(max_length=10, default="#1FBAD6")
    file = models.FileField(null=True, blank=True)
    is_reverse = models.BooleanField(default=False)
    time_axis = models.BooleanField(default=False)
    in_popup = models.BooleanField(default=False)
    reverse_url = models.CharField(max_length=100, blank=True, null=True)

    # Data based
    use_data = models.BooleanField(default=False)
    layer_id = models.CharField(max_length=100, blank=True, default="")
    field_x = models.CharField(max_length=100, blank=True, default="")
    field_y = models.CharField(max_length=100, blank=True, default="")
    field_r = models.CharField(max_length=100, blank=True, default="")
    field_label = models.CharField(max_length=100, blank=True, default="")

    def __str__(self):
        return f"{self.id}"


class Map(models.Model):
    id = models.CharField(unique=True, primary_key=True, max_length=20)
    added = models.DateTimeField('date published', auto_created=True, null=True)
    order = models.IntegerField(default=4)
    min_zoom = models.IntegerField(default=0)
    max_zoom = models.IntegerField(default=24)
    image = models.FileField()
    config = models.FileField()
    read_only = models.BooleanField(default=True)
    enabled = models.BooleanField(default=True)
    datasets = models.ManyToManyField(Dataset, null=True, blank=True)
    details_fi = models.OneToOneField(DetailsFi, on_delete=models.DO_NOTHING)
    details_en = models.OneToOneField(DetailsEn, on_delete=models.DO_NOTHING)
    statistics = models.ManyToManyField(StatisticsFile, null=True, blank=True)

    def __str__(self):
        return self.id
