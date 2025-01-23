from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
# Create your models here.


class User(AbstractUser):
    id = models.AutoField(primary_key=True) #인덱스  
    username = models.CharField(max_length=128, unique=True, verbose_name="아이디") #로그인아이디
    password = models.CharField(max_length=256, verbose_name="비밀번호") #로그인비밀번호
    first_name = models.CharField(max_length=256, null=True, default="", verbose_name="이름(first name)") #이름
    last_name = models.CharField(max_length=256, null=True,default="", verbose_name="성(last name)") #성
    date_joined = models.DateTimeField(default=timezone.now, verbose_name="회원가입날짜")
    last_login = models.DateTimeField(blank=True, null=True, verbose_name="최종접속일시")

    class Meta:
        db_table='user'
        managed = True

    def __str__(self):
        return f"{self.id} - {self.username} "