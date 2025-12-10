from django.db import IntegrityError
from django.utils.decorators import method_decorator
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Category, Note
from .serializers import CategorySerializer, NoteSerializer





@extend_schema(tags=['Categories'])
@extend_schema_view(
    list=extend_schema(summary='List categories'),
    retrieve=extend_schema(summary='Retrieve category'),
    create=extend_schema(summary='Create category'),
    update=extend_schema(summary='Update category'),
    partial_update=extend_schema(summary='Partially update category'),
    destroy=extend_schema(summary='Delete category'),
)
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by("name")

    def perform_create(self, serializer):
        # tie category to current user
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            return Response(
                {"detail": "Category with this name already exists for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, *args, **kwargs):
        # override to handle unique constraint gracefully
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"detail": "Category with this name already exists for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@extend_schema(tags=['Notes'])
@extend_schema_view(
    list=extend_schema(summary='List notes'),
    retrieve=extend_schema(summary='Retrieve note'),
    create=extend_schema(summary='Create note'),
    update=extend_schema(summary='Update note'),
    partial_update=extend_schema(summary='Partially update note'),
    destroy=extend_schema(summary='Delete note'),
)
class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Note.objects.filter(user=self.request.user).select_related("category").order_by("-updated_at")
        category_id = self.request.query_params.get("category") or self.request.query_params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def perform_create(self, serializer):
        # If no category provided, default to user's "Random Thoughts" if exists
        category = serializer.validated_data.get("category")
        if not category:
            category = Category.objects.filter(user=self.request.user, name__iexact="Random Thoughts").first()
        serializer.save(user=self.request.user, category=category)


class HealthCheck(APIView):
    permission_classes = [AllowAny]

    @extend_schema(tags=['Health'], summary='Health check')
    def get(self, request):
        return Response({"status": "ok"}, status=200)
