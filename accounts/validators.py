from django.core.exceptions import ValidationError
import re
from django.utils.translation import gettext_lazy as _

class CustomPasswordValidator:
    def __init__(self, min_length=10):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _(f'비밀번호는 최소 {self.min_length}자 이상이어야 합니다.'),
                code='password_too_short',
            )
        
        if not re.search('[0-9]', password):
            raise ValidationError(
                _('비밀번호는 최소 1개 이상의 숫자를 포함해야 합니다.'),
                code='password_no_number',
            )
            
        if not re.search('[a-z]', password):
            raise ValidationError(
                _('비밀번호는 최소 1개 이상의 영문 소문자를 포함해야 합니다.'),
                code='password_no_lower',
            )
            
        if not re.search('[A-Z]', password):
            raise ValidationError(
                _('비밀번호는 최소 1개 이상의 영문 대문자를 포함해야 합니다.'),
                code='password_no_upper',
            )
            
        if not re.search('[^A-Za-z0-9]', password):
            raise ValidationError(
                _('비밀번호는 최소 1개 이상의 특수문자를 포함해야 합니다.'),
                code='password_no_symbol',
            )

        # 사용자 정보와 비슷한 비밀번호 검사
        if user:
            if user.username.lower() in password.lower():
                raise ValidationError(
                    _('비밀번호는 사용자 정보를 포함할 수 없습니다.'),
                    code='password_too_similar',
                )

    def get_help_text(self):
        return _(
            f'비밀번호는 다음 조건을 만족해야 합니다:\n'
            f'- 최소 {self.min_length}자 이상\n'
            f'- 최소 1개 이상의 숫자\n'
            f'- 최소 1개 이상의 영문 대/소문자\n'
            f'- 최소 1개 이상의 특수문자\n'
            f'- 사용자 정보와 비슷한 비밀번호 사용 불가'
        )