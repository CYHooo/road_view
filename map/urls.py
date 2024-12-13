from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    
    # video upload
    path('videoupload/', views.videoupload, name="videoupload"),
    
    # 3d view image, 
    # 'com/view/{video_id}'
    path('view/<int:video_id>', views.view, name='view'),

    # tree info form && position data, 
    # 'com/info_position?image_id={img_id}'
    path('form_update/', views.form_update, name='form_update'),

    # fetch form data status
    # 'com/form_data?image_id={img_id}'
    # path('form_data/', views.form_data, name='form_data'),
    
]