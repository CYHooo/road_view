from django.db import models

# Create your models here.

class PanoramaVideo(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    datetime = models.DateField(auto_now=True)
    origintime = models.IntegerField()
    video = models.FileField(max_length=256, upload_to='video/', null=True, blank=True)
    

    class Meta:
        managed = False
        db_table = 'panorama_video'

    def __str__(self) -> str:
        return f'{self.id} - {self.datetime} - {self.name}'
    
class PanoramaImage(models.Model):
    id = models.AutoField(primary_key=True)
    image = models.ImageField(max_length=256, upload_to='img/', null=True, blank=True)
    video_id = models.ForeignKey(PanoramaVideo, on_delete=models.CASCADE, null=False, db_column='video_id')

    class Meta:
        managed = False
        db_table = 'panorama_image'

    def __str__(self) -> str:
        return f'{self.id} - video: {self.video_id.id} - {self.video_id.name}'
    
class TypeInfo(models.Model):
    id = models.AutoField(primary_key=True)
    address = models.CharField(max_length=256, verbose_name='장소')
    tree_type = models.CharField(max_length=256, verbose_name='수종')
    tree_num = models.IntegerField(verbose_name='수목')
    diameter = models.FloatField(verbose_name='흉고직경')
    tree_height = models.FloatField(verbose_name='수고')
    crown_width = models.FloatField(verbose_name='수관폭')
    tree_use = models.CharField(max_length=256, verbose_name='사용기종')
    worker_type = models.CharField(max_length=256, verbose_name='측정자 소속')
    worker_name = models.CharField(max_length=256, verbose_name='측정자 성명')
    front_image = models.ImageField(max_length=256, upload_to='tree/', null=True, blank=True)
    north_image = models.ImageField(max_length=256, upload_to='tree/', null=True, blank=True)
    south_image = models.ImageField(max_length=256, upload_to='tree/', null=True, blank=True)
    east_image = models.ImageField(max_length=256, upload_to='tree/', null=True, blank=True)
    west_image = models.ImageField(max_length=256, upload_to='tree/', null=True, blank=True)
    x = models.DecimalField(max_digits=8, decimal_places=6)
    y = models.DecimalField(max_digits=8, decimal_places=6)
    z = models.DecimalField(max_digits=8, decimal_places=6)
    image_id = models.ForeignKey(PanoramaImage, on_delete=models.CASCADE, null=False, db_column='image_id')

    class Meta:
        managed = False
        db_table = 'type_info'

    def __str__(self) -> str:
        return f'{self.id} - {self.address} - Image: {self.image_id.id}'