from django.db import models
from django.conf import settings


class WeeklyMenu(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="menus",
    )
    name = models.CharField(max_length=100, default="This week")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "weekly_menus"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.name}"


class MenuDay(models.Model):
    DAY_CHOICES = [
        ("Sunday", "Sunday"),
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
    ]

    menu = models.ForeignKey(WeeklyMenu, on_delete=models.CASCADE, related_name="days")
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    recipe = models.ForeignKey(
        "recipes.Recipe",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="menu_days",
    )

    class Meta:
        db_table = "menu_days"
        unique_together = ("menu", "day")
        ordering = ["id"]

    def __str__(self):
        return f"{self.day}: {self.recipe.title if self.recipe else '—'}"
