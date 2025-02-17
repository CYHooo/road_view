from django.db import models

# Create your models here.
class Sensor(models.Model):
    id = models.CharField(max_length=256, primary_key=True)
    x = models.DecimalField(max_digits=8, decimal_places=3)
    y = models.DecimalField(max_digits=8, decimal_places=3)
    datetime = models.DateTimeField(auto_now=False, auto_now_add=False)
    stamptime = models.IntegerField()


    class Meta:
        managed = False
        db_table = 'sensor'

    def __str__(self) -> str:
        return f'{self.datetime} - {self.id} - {self.stamptime}'