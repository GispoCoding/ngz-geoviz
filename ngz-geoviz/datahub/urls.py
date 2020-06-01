from django.conf import settings
from django.urls import path

from .views import (TestView, VesselView, TrainView, VesselStatisticsView, TrainStatisticsView, redirect_to_static_csv_data,
                    redirect_to_static_json_data, redirect_to_static_digitraffic_data, MapConfigurations,
                    start_async_mqtt_loaders, populate_digitraffic_models, is_authenticated)

urlpatterns = [
    path('digitraffic/vessels', VesselView.as_view(), name='vessels'),
    path('digitraffic/trains', TrainView.as_view(), name='trains'),
    path('digitraffic/vesselStatistics', VesselStatisticsView.as_view(), name='vessel-statistics'),
    path('digitraffic/trainStatistics', TrainStatisticsView.as_view(), name='train-statistics'),
    path('maps', MapConfigurations.as_view(), name='maps'),
    path('csv', redirect_to_static_csv_data, name='csv'),
    path('dt', redirect_to_static_digitraffic_data, name='dt'),
    path('json', redirect_to_static_json_data, name='json'),
    path('start_mqtt', start_async_mqtt_loaders),
    path('populate', populate_digitraffic_models),
    path('is_authenticated', is_authenticated)
]

debug_urls = [
    path('test_geojson', TestView.as_view())
]

if settings.DEBUG:
    urlpatterns += debug_urls
