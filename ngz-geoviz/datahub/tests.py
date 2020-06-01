from django.test import TestCase
from unittest import skip
from .models import Vessel, Train
from .digitraffic import VesselSaver, TrainSaver
import os
from django.urls import reverse


# Create your tests here.

class VesselTestCase(TestCase):
    def setUp(self):
        dirname = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.test_data_dir1 = os.path.join(dirname, 'test_data', 'data1')
        self.test_data_dir2 = os.path.join(dirname, 'test_data', 'data2')

    def test_vessel_populating(self):
        period_no_filtering = {'PERIOD_HOURS': 1000000000000}
        with self.settings(DATA_DIR=self.test_data_dir1, DIGITRAFFIC=period_no_filtering):
            saver = VesselSaver("10s", False)
            saver.populate()
            pks = list(Vessel.objects.values_list('pk', flat=True))
            self.assertEqual(len(pks), 2)

        with self.settings(DATA_DIR=self.test_data_dir2, DIGITRAFFIC=period_no_filtering):
            saver = VesselSaver("10s", False)
            saver.populate()
            self.assertEqual(Vessel.objects.count(), 4)
            response = self.client.get(reverse("vessels"))
            self.assertEqual(len(response.content), 1206)

    def test_train_populating(self):
        period_no_filtering = {'PERIOD_HOURS': 1000000000000}
        with self.settings(DATA_DIR=self.test_data_dir1, DIGITRAFFIC=period_no_filtering):
            saver = TrainSaver("10s", False)
            saver.populate()
            pks = list(Train.objects.values_list('pk', flat=True))
            self.assertEqual(len(pks), 71)

        with self.settings(DATA_DIR=self.test_data_dir2, DIGITRAFFIC=period_no_filtering):
            saver = TrainSaver("10s", False)
            saver.populate()
            self.assertEqual(Train.objects.count(), 75)
            response = self.client.get(reverse("trains"))
            self.assertEqual(len(response.content), 21987)

    def test_train_populating_with_filter(self):
        with self.settings(DATA_DIR=self.test_data_dir1):
            saver = TrainSaver("3s", False)
            saver.populate()
            pks = list(Train.objects.values_list('pk', flat=True))
            self.assertEqual(len(pks), 71)
        period_92s = {'PERIOD_HOURS': 0.0255}  # 30s
        with self.settings(DATA_DIR=self.test_data_dir2, DIGITRAFFIC=period_92s):
            saver = TrainSaver("3s", False)
            saver.populate()
            self.assertEqual(Train.objects.count(), 74)
            response = self.client.get(reverse("trains"))
            self.assertEqual(len(response.content), 18621)
