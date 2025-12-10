from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "is_active", "is_staff", "is_superuser", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser", "groups")
    search_fields = ("username",)
    ordering = ("-date_joined",)
    filter_horizontal = ("groups", "user_permissions")
    readonly_fields = ("date_joined", "last_login")
