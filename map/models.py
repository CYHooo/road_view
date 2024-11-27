from django.db import models

# Create your models here.

class PanoramaVideo(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    datetime = models.DateField(auto_now=True)
    video = models.FileField(max_length=256, upload_to='video/', null=True, blank=True)
    

    class Meta:
        managed = False
        db_table = 'panorama_video'

    def __str__(self) -> str:
        return f'{self.id} - {self.datetime} - {self.name}'
    
class PanoramaImage(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.ImageField(max_length=256, upload_to='img/')
    video_id = models.ForeignKey(PanoramaVideo, on_delete=models.CASCADE, null=False, db_column='video_id')

    class Meta:
        managed = True
        db_table = 'panorama_image'

    def __str__(self) -> str:
        return f'{self.id} - from video {self.video_id.id} - {self.video_id.name}'