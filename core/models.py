from __future__ import unicode_literals
from datetime import datetime
from django import utils

from django.db import models

# Create your models here.
class Preview(models.Model):
	title = models.CharField(max_length=200)
	subtitle = models.CharField(max_length=1000)
	image_link = models.CharField(max_length=200)
	tags = models.CharField(max_length=1000)
	content_link = models.CharField(max_length=100)
	pub_date = models.DateTimeField('date published', default = utils.timezone.now)
	def __str__(self):
		return self.title

