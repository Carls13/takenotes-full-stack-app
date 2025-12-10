from rest_framework import serializers
from .models import User


class UserRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        username = value.strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return username

    def create(self, validated_data):
        username = validated_data["username"].strip()
        password = validated_data["password"]
        user = User.objects.create_user(username=username, password=password)
        return user

    def to_representation(self, instance):
        return {"id": str(instance.id), "username": instance.username}