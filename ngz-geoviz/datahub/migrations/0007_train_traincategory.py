# Generated by Django 3.0.3 on 2020-02-25 07:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datahub', '0006_auto_20200224_1212'),
    ]

    operations = [
        migrations.AddField(
            model_name='train',
            name='trainCategory',
            field=models.CharField(default='Cargo', max_length=20),
            preserve_default=False,
        ),
    ]