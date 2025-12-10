from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, NoteViewSet, HealthCheck

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    # Health
    path('health/', HealthCheck.as_view(), name='health'),

    # API routes
    path('', include(router.urls)),
]