from rest_framework import serializers
from .models import Vessel, Train


# Since rest_framework_gis is used, all geometry fields transform to geojson geometry automatically
class VesselSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vessel
        fields = '__all__'


class TrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Train
        fields = '__all__'
