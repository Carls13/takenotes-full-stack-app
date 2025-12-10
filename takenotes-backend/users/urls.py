from django.urls import path
from .views import RegisterView, TokenObtainPairPatchedView, TokenRefreshPatchedView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairPatchedView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshPatchedView.as_view(), name='token_refresh'),
]