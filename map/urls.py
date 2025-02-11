from django.urls import path
from . import views


urlpatterns = [
    ## .com/main/~ ##

    ## .com/main/dashboard/
    path('dashboard/', views.dashboard, name="dashboard"),
    
    # video upload
    ## .com/main/videoupload_index/
    path('videoupload_index/', views.videoupload_index, name="videoupload_index"),
    
    path('videoupload/', views.videoupload, name="videoupload"),


    # 3d view image, 
    ## .com/main/parnorma_index/
    path('parnorma_index/', views.panorama_index, name='panorama_index'),
    path('panorama/<int:video_id>/', views.panorama, name='panorama'),
    # path('view/<int:video_id>', views.view, name='view'),

    # tree info form && position data, 
    # 'com/info_position?image_id={img_id}'
    path('form_update/', views.form_update, name='form_update'),

    # fetch form data status
    # 'com/form_data?image_id={img_id}'
    # path('form_data/', views.form_data, name='form_data'),
    
]