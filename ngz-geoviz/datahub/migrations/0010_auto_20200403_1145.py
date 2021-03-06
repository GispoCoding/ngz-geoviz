# Generated by Django 3.0.4 on 2020-04-03 11:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0009_dataset_detailsen_detailsfi_map'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataset',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to=''),
        ),
        migrations.AlterField(
            model_name='map',
            name='datasets',
            field=models.ManyToManyField(blank=True, null=True, to='datahub.Dataset'),
        ),
    ]
