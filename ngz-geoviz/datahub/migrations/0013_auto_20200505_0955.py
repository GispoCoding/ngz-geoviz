# Generated by Django 3.0.4 on 2020-05-05 09:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0012_trainstatistics_vesselstatistics'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='trainstatistics',
            name='obj',
        ),
        migrations.RemoveField(
            model_name='vesselstatistics',
            name='obj',
        ),
        migrations.AddField(
            model_name='trainstatistics',
            name='obj_id',
            field=models.IntegerField(default=-1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='vesselstatistics',
            name='obj_id',
            field=models.IntegerField(default=-1),
            preserve_default=False,
        ),
    ]