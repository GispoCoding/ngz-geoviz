# Generated by Django 3.0.4 on 2020-05-13 14:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0015_auto_20200508_1233'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='statisticsfile',
            name='label',
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='field_label',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='field_r',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='field_x',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='field_y',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='in_popup',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='label_en',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='label_fi',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='layer_id',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='time_axis',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='statisticsfile',
            name='use_data',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='statisticsfile',
            name='type',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
