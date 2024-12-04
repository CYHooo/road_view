from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('videoupload/', views.videoupload, name="videoupload"),
    path('view/<int:video_id>', views.view, name='view'),
    path('info_position/', views.info_position, name='info_position'),
    
]