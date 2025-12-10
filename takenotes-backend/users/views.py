from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
 
from .serializers import UserRegisterSerializer
from notes.models import Category

# Default categories to auto-create for a new user
DEFAULT_CATEGORIES = [
    ("Random Thoughts", "#A78BFA"),  # purple-400
    ("School", "#60A5FA"),           # blue-400
    ("Personal", "#F59E0B"),         # amber-500
]

@extend_schema(tags=['Auth'], summary='Obtain JWT token pair', operation_id='auth_token_obtain_pair')
class TokenObtainPairPatchedView(TokenObtainPairView):
    pass

@extend_schema(tags=['Auth'], summary='Refresh JWT access token', operation_id='auth_token_refresh')
class TokenRefreshPatchedView(TokenRefreshView):
    pass

@extend_schema(tags=['Auth'], summary='Register new user')
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create default categories for the new user
        for name, color in DEFAULT_CATEGORIES:
            try:
                Category.objects.create(user=user, name=name, color=color)
            except IntegrityError:
                # In case of racing or duplicates, ignore
                pass

        # Issue JWT tokens
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            tokens = {"refresh": str(refresh), "access": str(refresh.access_token)}
        except Exception:
            tokens = None

        data = serializer.to_representation(user)
        if tokens:
            data["tokens"] = tokens
        return Response(data, status=status.HTTP_201_CREATED)
