# accounts/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import CustomUserCreationForm, CustomUserChangeForm, CustomPasswordChangeForm, CustomAuthenticationForm

User = get_user_model()  

# 회원가입
def signup(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user_data = form.get_user_data()
            user = User.objects.create(
                username=user_data['username'],
                name=user_data['name']
            )
            user.set_password(user_data['password1']) # 암호화
            user.save()
            login(request, user)
            messages.success(request, '회원가입이 완료되었습니다.')
            return redirect('home')
    else:
        form = CustomUserCreationForm() # 현재 사용자 정보로 폼 초기화 
    return render(request, 'accounts/signup.html', {'form': form})

# 프로필 수정
@login_required
def profile(request):
    if request.method == 'POST':
        form = CustomUserChangeForm(request.POST, instance=request.user)
        if form.is_valid():
            user_data = form.get_user_data()
            request.user.name = user_data['name']
            request.user.save()
            messages.success(request, '프로필이 업데이트되었습니다.')
            return redirect('profile')
    else:
        form = CustomUserChangeForm(instance=request.user)
    return render(request, 'accounts/profile.html', {'form': form})

# 비밀번호 변경
@login_required
def password_change(request):
    if request.method == 'POST':
        form = CustomPasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, '비밀번호가 변경되었습니다.')
            return redirect('profile')
    else:
        form = CustomPasswordChangeForm(request.user)
    
    # 비밀번호 만료까지 남은 일수 계산
    days_left = request.user.days_until_password_expires
    return render(request, 'accounts/password_change.html', {
        'form': form,
        'days_left': days_left
    })

# 로그아웃 
def logout_view(request):
    logout(request)
    messages.success(request, '로그아웃되었습니다.')
    return redirect('home')  # 홈 페이지로 리다이렉트

# 로그인
def login_view(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                user.reset_login_attempts()  # 로그인 성공시 실패 횟수 초기화
                messages.success(request, '로그인되었습니다.')
                
                # next 파라미터가 있으면 해당 페이지로 리다이렉트
                next_url = request.GET.get('next')
                if next_url:
                    return redirect(next_url)
                return redirect('home')
            else:
                user = User.objects.get(username=username)
                user.increment_login_attempts()  # 로그인 실패시 횟수 증가
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'accounts/login.html', {'form': form})
