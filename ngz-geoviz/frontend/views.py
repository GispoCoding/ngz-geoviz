from django.shortcuts import render
from django.views.decorators.clickjacking import xframe_options_exempt


@xframe_options_exempt
def index(request):
  return render(request, 'frontend/index.html')
