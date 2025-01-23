from django import forms
from .models import User 

class SignupForm(forms.ModelForm):
    class Meta:
        model = User
#        fields = ["email", "password", "company_id", "first_name", "last_name"]
        fields =["first_name", "last_name"]

    def signup(self, request, user):
        #user.email = self.cleaned_data["email"]
        # user.password = self.cleaned_data["password"]
        
        user.first_name = self.cleaned_data["first_name"]
        user.last_name = self.cleaned_data["last_name"]
        user.username = user.first_name + user.last_name
        user.save()