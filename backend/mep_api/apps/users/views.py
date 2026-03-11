from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import PantryItem
from .serializers import RegisterSerializer, UserSerializer, PantryItemSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PantryListCreateView(generics.ListCreateAPIView):
    serializer_class = PantryItemSerializer

    def get_queryset(self):
        return PantryItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PantryDestroyView(generics.DestroyAPIView):
    serializer_class = PantryItemSerializer

    def get_queryset(self):
        return PantryItem.objects.filter(user=self.request.user)
