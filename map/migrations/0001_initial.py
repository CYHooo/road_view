# Generated by Django 5.0.3 on 2024-11-27 04:45

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='panorama',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=256)),
                ('datetime', models.DateField(auto_now=True)),
                ('video', models.FileField(blank=True, max_length=256, null=True, upload_to='temp/')),
                ('image', models.ImageField(blank=True, max_length=256, null=True, upload_to='img/')),
            ],
            options={
                'db_table': 'panorama',
                'managed': False,
            },
        ),
    ]
