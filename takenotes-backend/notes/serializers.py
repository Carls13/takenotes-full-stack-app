from django.utils import timezone
from rest_framework import serializers
import datetime

from .models import Category, Note




class CategorySerializer(serializers.ModelSerializer):
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "color", "created_at", "updated_at", "note_count"]

    def get_note_count(self, obj):
        user = self.context["request"].user
        # count only this user's notes in this category
        return obj.notes.filter(user=user).count()


class NoteSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    last_edited = serializers.DateTimeField(source="updated_at", read_only=True)
    last_edited_label = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id",
            "title",
            "content",
            "category",
            "category_name",
            "category_color",
            "created_at",
            "updated_at",
            "last_edited",
            "last_edited_label",
        ]
        read_only_fields = ["created_at", "updated_at", "last_edited", "last_edited_label"]

    def get_last_edited_label(self, obj):
        # "Today", "Yesterday", or "Mon DD"
        user_tz = timezone.get_current_timezone()
        now = timezone.now().astimezone(user_tz)
        updated = obj.updated_at.astimezone(user_tz)
        if updated.date() == now.date():
            return "Today"
        if updated.date() == (now.date() - datetime.timedelta(days=1)):
            return "Yesterday"
        return updated.strftime("%b %d")