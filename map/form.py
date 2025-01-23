from django import forms
import re
import json

class TreeInfoForm(forms.Form):
    address = forms.CharField(required=False)
    treeType = forms.CharField(required=False)
    diameter = forms.FloatField(required=False)
    treeHeight = forms.FloatField(required=False)
    treeWidth = forms.FloatField(required=False)
    treeNum = forms.IntegerField(required=False)
    treeUse = forms.CharField(required=False) 
    workerType = forms.CharField(required=False)
    workerName = forms.CharField(required=False)
    position = forms.CharField(required=False)
    pre = forms.FileField(required=False)
    east = forms.FileField(required=False)
    west = forms.FileField(required=False)
    north = forms.FileField(required=False)
    south = forms.FileField(required=False)
    imageId = forms.IntegerField(required=True)

    def clean(self):
        form_data = super().clean()
        data = {}

        for key, value in form_data.items():
            if key == 'position':
                position_value = json.loads(value)
                data['x'] = position_value['x']
                data['y'] = position_value['y']
                data['z'] = position_value['z']
            else:
                data[key] = value

        return data
