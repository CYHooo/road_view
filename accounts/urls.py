# accounts/urls.py
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('profile/', views.profile, name='profile'),
    path('password/change/', views.password_change, name='password_change'),
    path('logout/', views.logout_view, name='logout'),
    path('login/', views.login_view, name='login'),

]