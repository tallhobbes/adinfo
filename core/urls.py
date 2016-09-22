from django.conf.urls import url

from . import views

urlpatterns = [
	url(r'^$', views.index, name='index'),
	url(r'^research/$', views.research, name='research'),
	url(r'^rstats/$', views.rstats, name='rstats'),
	url(r'^viz/$', views.viz, name='viz'),
]