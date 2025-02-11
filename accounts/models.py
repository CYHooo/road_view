# accounts/models.py

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    # 사용자 생성 관리
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # 관리자 생성 관리
    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    # 기본 필드 
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text=_('Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
    )
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # admin 페이지 권한 
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)

    # 비밀번호 관련 필드
    password_changed_at = models.DateTimeField(
        default=timezone.now,
        help_text='마지막으로 비밀번호를 변경한 시간'
    )
    password_expires_at = models.DateTimeField(
        default=timezone.now() + timedelta(days=90),
        help_text='비밀번호 만료 시간'
    )

    # 로그인 관리 
    login_attempts = models.IntegerField(default=0)
    last_login_attempt = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)  # locked_until 대신 locked_at으로 변경

    # 추가적인 권한 관련 필드
    is_admin = models.BooleanField(default=False) # 특정 관리자, 사용자관리, 콘텐츠 관리 등

    # 권한관리 user, manger, admin
    role = models.CharField(
        max_length=20,
        choices=[
            ('user', 'Regular User'),
            ('manager', 'Manager'),
            ('admin', 'Administrator')
        ],
        default='user'
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.username

    # 비밀번호 변경시 자동으로 시간 업데이트 
    def set_password(self, raw_password):
        super().set_password(raw_password)
        self.password_changed_at = timezone.now()
        self.password_expires_at = self.password_changed_at + timedelta(days=90)

    # 비밀번호 만료 체크 
    @property
    def is_password_expired(self):
        """비밀번호가 만료되었는지 확인"""
        return timezone.now() >= self.password_expires_at

    @property
    def days_until_password_expires(self):
        """비밀번호 만료까지 남은 일수"""
        if self.is_password_expired:
            return 0
        delta = self.password_expires_at - timezone.now()
        return max(0, delta.days)
    
    # 로그인 관리
    def increment_login_attempts(self):
        self.login_attempts += 1
        self.last_login_attempt = timezone.now()
        
        if self.login_attempts >= 5:
            self.is_locked = True
            self.locked_at = timezone.now()
        
        self.save()

    def reset_login_attempts(self):
        self.login_attempts = 0
        self.last_login_attempt = None
        self.is_locked = False
        self.locked_at = None
        self.save()

    def check_if_locked(self):
        return self.is_locked