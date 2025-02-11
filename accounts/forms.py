# accounts/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, PasswordChangeForm, AuthenticationForm
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()

# 회원가입 
class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'name') # password는 기본적으로 포함 
    
    def clean_username(self): # username = id 필드 중복검사 
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise ValidationError('이미 사용중인 아이디입니다.')
        return username
    
    def get_user_data(self):
        return self.cleaned_data

# 프로필 수정
class CustomUserChangeForm(UserChangeForm):
    password = None  # 비밀번호 필드 제외

    class Meta:
        model = User
        fields = ('name',) # 이름만 수정

    def get_user_data(self):
        return self.cleaned_data
    
# 비밀번호 변경
class CustomPasswordChangeForm(PasswordChangeForm):
    def clean_new_password2(self):
        password1 = self.cleaned_data.get('new_password1')
        password2 = self.cleaned_data.get('new_password2')
        if password1 and password2 and password1 != password2:
            raise ValidationError('새 비밀번호가 일치하지 않습니다.')
        return password2

# 로그인 관리 
class CustomAuthenticationForm(AuthenticationForm):
    def clean(self):
        username = self.cleaned_data.get('username')
        if username:
            try:
                user = User.objects.get(username=username)
                if user.check_if_locked():
                    raise ValidationError(
                        '계정이 잠겼습니다. 관리자(admin@example.com)에게 연락하여 잠금 해제를 요청해주세요.'
                    )
            except User.DoesNotExist:
                pass

        return super().clean()