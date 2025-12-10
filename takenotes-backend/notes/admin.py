from django.contrib import admin
from .models import Category, Note


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "user", "color", "created_at", "updated_at")
    list_filter = ("user",)
    search_fields = ("name", "user__username")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "category", "updated_at")
    list_filter = ("user", "category")
    search_fields = ("title", "content", "user__username")
