from django.contrib import admin
from .models import Dataset, DetailsEn, DetailsFi, Map, StatisticsFile

# Register your models here.
admin.site.register(Dataset)
admin.site.register(DetailsEn)
admin.site.register(DetailsFi)
admin.site.register(StatisticsFile)
admin.site.register(Map)