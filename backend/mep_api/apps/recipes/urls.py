from django.urls import path
from .views import RecipeListCreateView, RecipeDetailView, ParseRecipeView

urlpatterns = [
    path("recipes/", RecipeListCreateView.as_view(), name="recipe_list"),
    path("recipes/<int:pk>/", RecipeDetailView.as_view(), name="recipe_detail"),
    path("recipes/parse/", ParseRecipeView.as_view(), name="recipe_parse"),
]
