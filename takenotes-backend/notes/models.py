from django.db import models
from django.conf import settings
import uuid


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default="#A3A3A3")  # HEX color like #RRGGBB

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'name'], name='unique_category_name_per_user'),
        ]
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Note(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='notes')
    title = models.CharField(max_length=200, blank=True, default='')
    content = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-updated_at']

    @property
    def last_edited(self):
        return self.updated_at
