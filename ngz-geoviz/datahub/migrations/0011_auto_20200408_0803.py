# Generated by Django 3.0.4 on 2020-04-08 08:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0010_auto_20200403_1145'),
    ]

    operations = [
        migrations.AddField(
            model_name='map',
            name='max_zoom',
            field=models.IntegerField(default=24),
        ),
        migrations.AddField(
            model_name='map',
            name='min_zoom',
            field=models.IntegerField(default=0),
        ),
    ]
