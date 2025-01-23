# accounts/admin.py

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from django.shortcuts import redirect

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['username', 'name', 'is_locked', 'login_attempts', 'locked_status', 'actions_buttons']
    list_filter = ['is_locked']
    search_fields = ['username', 'name']
    
    def locked_status(self, obj):
        if obj.is_locked:
            return format_html('<span style="color: red;">Locked</span>')
        return format_html('<span style="color: green;">Active</span>')
    locked_status.short_description = 'Status'

    def actions_buttons(self, obj):
        if obj.is_locked:
            return format_html(
                '<a class="button" href="{}">Unlock Account</a>',
                f'/admin/unlock-account/{obj.pk}/'
            )
        return "-"
    actions_buttons.short_description = 'Actions'

    def unlock_account(self, request, user_id):
        user = User.objects.get(pk=user_id)
        user.reset_login_attempts()
        self.message_user(request, f"계정 {user.username}의 잠금이 해제되었습니다.")
        return redirect('admin:accounts_customuser_changelist')