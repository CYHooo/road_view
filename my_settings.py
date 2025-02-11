SECRET_KEY = "django-insecure-v1q4me==@piozx94wy2ty^w*i#2kgn+_6u61=af#vl#$zo)9!6"
import pymysql
pymysql.install_as_MySQLdb()

# mysql 데이터베이스 설정 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': '3dview_v3',
        'USER': 'local',
        'PASSWORD' : '123456789',
        'HOST' : 'localhost',
        'PORT' : '3306',
        'OPTIONS': {
        'init_command' : "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}