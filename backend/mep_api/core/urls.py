from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("mep_api.apps.users.urls")),
    path("api/", include("mep_api.apps.recipes.urls")),
    path("api/", include("mep_api.apps.menus.urls")),
]
