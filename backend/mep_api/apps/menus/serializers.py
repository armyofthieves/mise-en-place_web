from rest_framework import serializers
from .models import WeeklyMenu, MenuDay
from mep_api.apps.recipes.serializers import RecipeListSerializer


class MenuDaySerializer(serializers.ModelSerializer):
    recipe = RecipeListSerializer(read_only=True)
    recipe_id = serializers.IntegerField(allow_null=True, write_only=True, required=False)

    class Meta:
        model = MenuDay
        fields = ("id", "day", "recipe", "recipe_id")


class WeeklyMenuSerializer(serializers.ModelSerializer):
    days = MenuDaySerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyMenu
        fields = ("id", "name", "days", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
