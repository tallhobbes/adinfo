from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.
def index(request):
	#return HttpResponse('And it begins...')
	return render(request, 'core/index.html')

def research(request):
	return render(request, 'core/research.html')

def rstats(request):
	return render(request, 'core/rstats.html')

def viz(request):
	return render(request, 'core/viz.html')