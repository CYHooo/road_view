SECRET_KEY = "django-insecure-v1q4me==@piozx94wy2ty^w*i#2kgn+_6u61=af#vl#$zo)9!6"
import pymysql
pymysql.install_as_MySQLdb()

# mysql 데이터베이스 설정 
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': '3dview_2',
        'USER': 'root',
        'PASSWORD' : 'R1d1s9**',
        'HOST' : 'test.c52c2ks4amjm.ap-northeast-2.rds.amazonaws.com',
        'PORT' : '3306',
        'OPTIONS': {
        'init_command' : "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}