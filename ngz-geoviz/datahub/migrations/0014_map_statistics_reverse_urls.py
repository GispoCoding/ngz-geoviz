# Generated by Django 3.0.4 on 2020-05-05 10:12

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0013_auto_20200505_0955'),
    ]

    operations = [
        migrations.AddField(
            model_name='map',
            name='statistics_reverse_urls',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=100), blank=True, default=list, size=None),
        ),
    ]