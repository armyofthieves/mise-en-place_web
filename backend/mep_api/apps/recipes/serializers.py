from rest_framework import serializers
from .models import Recipe, Ingredient, RecipeStep


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ("id", "name", "quantity", "unit", "order")
        read_only_fields = ("id",)


class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ("id", "instruction", "order")
        read_only_fields = ("id",)


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True)
    steps = RecipeStepSerializer(many=True)

    class Meta:
        model = Recipe
        fields = (
            "id", "title", "description", "source_url",
            "servings", "prep_time", "cook_time",
            "rating", "in_rotation", "tags",
            "ingredients", "steps",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients", [])
        steps_data = validated_data.pop("steps", [])
        recipe = Recipe.objects.create(**validated_data)
        for i, ing in enumerate(ingredients_data):
            Ingredient.objects.create(recipe=recipe, order=i, **ing)
        for i, step in enumerate(steps_data):
            RecipeStep.objects.create(recipe=recipe, order=i, **step)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)
        steps_data = validated_data.pop("steps", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_data is not None:
            instance.ingredients.all().delete()
            for i, ing in enumerate(ingredients_data):
                Ingredient.objects.create(recipe=instance, order=i, **ing)

        if steps_data is not None:
            instance.steps.all().delete()
            for i, step in enumerate(steps_data):
                RecipeStep.objects.create(recipe=instance, order=i, **step)

        return instance


class RecipeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — no nested steps."""
    ingredients = IngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Recipe
        fields = (
            "id", "title", "description", "source_url",
            "servings", "prep_time", "cook_time",
            "rating", "in_rotation", "tags",
            "ingredients", "created_at",
        )
