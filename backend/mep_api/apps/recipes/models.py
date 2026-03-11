from django.db import models
from django.conf import settings


class Recipe(models.Model):
    RATING_CHOICES = [
        ("loved", "Loved it"),
        ("okay", "It was okay"),
        ("skip", "Skip it"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recipes",
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    source_url = models.URLField(blank=True, null=True)
    servings = models.PositiveSmallIntegerField(default=4)
    prep_time = models.CharField(max_length=50, blank=True)
    cook_time = models.CharField(max_length=50, blank=True)
    rating = models.CharField(max_length=10, choices=RATING_CHOICES, blank=True, null=True)
    in_rotation = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "recipes"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Ingredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="ingredients")
    name = models.CharField(max_length=300)
    quantity = models.FloatField(null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "ingredients"
        ordering = ["order"]

    def __str__(self):
        return f"{self.quantity or ''} {self.unit} {self.name}".strip()


class RecipeStep(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="steps")
    instruction = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "recipe_steps"
        ordering = ["order"]

    def __str__(self):
        return f"Step {self.order}: {self.instruction[:60]}"
