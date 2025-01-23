# accounts/middleware.py

from django.shortcuts import redirect
from django.urls import reverse
from django.contrib import messages

class PasswordExpirationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            if request.user.is_password_expired:
                if request.path != reverse('password_change'):
                    messages.warning(request, '비밀번호가 만료되었습니다. 새로운 비밀번호로 변경해주세요.')
                    return redirect('password_change')
            elif request.user.days_until_password_expires <= 14:  # 만료 14일 전부터 알림
                messages.info(request, f'비밀번호가 {request.user.days_until_password_expires}일 후에 만료됩니다.')
        
        response = self.get_response(request)
        return response