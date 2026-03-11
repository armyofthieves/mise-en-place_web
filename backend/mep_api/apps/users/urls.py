from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, PantryListCreateView, PantryDestroyView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("pantry/", PantryListCreateView.as_view(), name="pantry_list"),
    path("pantry/<int:pk>/", PantryDestroyView.as_view(), name="pantry_delete"),
]
