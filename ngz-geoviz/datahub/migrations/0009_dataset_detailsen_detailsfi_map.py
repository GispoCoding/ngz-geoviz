# Generated by Django 3.0.4 on 2020-04-03 10:16

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0008_train_speed'),
    ]

    operations = [
        migrations.CreateModel(
            name='Dataset',
            fields=[
                ('id', models.CharField(max_length=20, primary_key=True, serialize=False, unique=True)),
                ('file', models.FileField(null=True, upload_to='')),
                ('label', models.CharField(max_length=500, null=True)),
                ('type', models.CharField(max_length=10, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='DetailsEn',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=200)),
                ('detail', models.TextField(blank=True)),
                ('desc', models.TextField(blank=True)),
                ('dataurl', models.URLField(max_length=1000)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='DetailsFi',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('label', models.CharField(max_length=200)),
                ('detail', models.TextField(blank=True)),
                ('desc', models.TextField(blank=True)),
                ('dataurl', models.URLField(max_length=1000)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Map',
            fields=[
                ('added', models.DateTimeField(auto_created=True, null=True, verbose_name='date published')),
                ('id', models.CharField(max_length=20, primary_key=True, serialize=False, unique=True)),
                ('order', models.IntegerField(default=4)),
                ('image', models.FileField(upload_to='')),
                ('config', models.FileField(upload_to='')),
                ('read_only', models.BooleanField(default=True)),
                ('enabled', models.BooleanField(default=True)),
                ('datasets', models.ManyToManyField(null=True, to='datahub.Dataset')),
                ('details_en', models.OneToOneField(on_delete=django.db.models.deletion.DO_NOTHING, to='datahub.DetailsEn')),
                ('details_fi', models.OneToOneField(on_delete=django.db.models.deletion.DO_NOTHING, to='datahub.DetailsFi')),
            ],
        ),
    ]
