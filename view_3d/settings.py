"""
Django settings for view_3d project.

Generated by 'django-admin startproject' using Django 5.0.3.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
import my_settings
SECRET_KEY = my_settings.SECRET_KEY

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'map',
    "widget_tweaks",

    # 'user',
    "accounts",
    # 'allauth',
    # 'allauth.account',
    'home',   
    
]
SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    # "allauth.account.middleware.AccountMiddleware",
    'accounts.middleware.PasswordExpirationMiddleware',

]

AUTH_USER_MODEL = 'accounts.CustomUser'
ROOT_URLCONF = 'view_3d.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'view_3d.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = my_settings.DATABASES


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            'min_length': 10,
        }
    },

    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
        {
        "NAME": "accounts.validators.CustomPasswordValidator",
    },
]



# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = "Asia/Seoul"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# auth setting 
# Reference: https://docs.allauth.org/en/latest/installation/quickstart.html



# AUTHENTICATION_BACKENDS = [
#     'django.contrib.auth.backends.ModelBackend',  # 默认后端
#     'allauth.account.auth_backends.AuthenticationBackend',  # allauth 后端
# ]
# ACCOUNT_LOGOUT_ON_GET = True
# ACCOUNT_SIGNUP_FORM_CLASS = "user.forms.SignupForm"

# ACCOUNT_EMAIL_REQUIRED = False                     # 必须提供电子邮件
# ACCOUNT_USERNAME_REQUIRED = True                  # 必须提供用户名
# ACCOUNT_EMAIL_VERIFICATION = 'none'          # 可选邮箱验证 ('mandatory', 'optional', 'none')
                 
# ACCOUNT_LOGOUT_REDIRECT_URL = '/'                 # 登出后的重定向 URL
# LOGIN_REDIRECT_URL = '/'                        # 登录成功后的重定向 URL
# ACCOUNT_SIGNUP_REDIRECT_URL = 'account_login'

