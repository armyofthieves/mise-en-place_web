from django.urls import path
from .views import (
    WeeklyMenuListCreateView,
    WeeklyMenuDetailView,
    GenerateMenuView,
    UpdateMenuDayView,
)

urlpatterns = [
    path("menus/", WeeklyMenuListCreateView.as_view(), name="menu_list"),
    path("menus/<int:pk>/", WeeklyMenuDetailView.as_view(), name="menu_detail"),
    path("menus/generate/", GenerateMenuView.as_view(), name="menu_generate"),
    path("menus/<int:menu_pk>/days/<str:day>/", UpdateMenuDayView.as_view(), name="menu_day_update"),
]
