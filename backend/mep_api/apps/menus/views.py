import random
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WeeklyMenu, MenuDay
from .serializers import WeeklyMenuSerializer
from mep_api.apps.recipes.models import Recipe

COOKING_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def shuffle_no_repeats(items: list) -> list:
    """Shuffle a list ensuring no two identical adjacent items."""
    pool = items.copy()
    random.shuffle(pool)
    for i in range(1, len(pool)):
        if pool[i] == pool[i - 1]:
            swap_idx = (i + 1) % len(pool)
            pool[i], pool[swap_idx] = pool[swap_idx], pool[i]
    return pool


class WeeklyMenuListCreateView(generics.ListCreateAPIView):
    serializer_class = WeeklyMenuSerializer

    def get_queryset(self):
        return WeeklyMenu.objects.filter(user=self.request.user).prefetch_related(
            "days__recipe__ingredients"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeeklyMenuDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WeeklyMenuSerializer

    def get_queryset(self):
        return WeeklyMenu.objects.filter(user=self.request.user).prefetch_related(
            "days__recipe__ingredients"
        )


class GenerateMenuView(APIView):
    """
    POST /api/menus/generate/
    Body: { "enabled_days": ["Sunday", "Monday", ...], "menu_id": 1 (optional) }

    Creates (or replaces) a WeeklyMenu for the user using their rotation recipes,
    shuffled with no adjacent repeats.
    """

    def post(self, request):
        enabled_days = request.data.get("enabled_days", COOKING_DAYS)
        menu_id = request.data.get("menu_id")

        rotation_recipes = list(
            Recipe.objects.filter(user=request.user, in_rotation=True)
        )

        if not rotation_recipes:
            return Response(
                {"error": "No recipes in rotation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not enabled_days:
            return Response(
                {"error": "No days enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create the menu
        if menu_id:
            try:
                menu = WeeklyMenu.objects.get(pk=menu_id, user=request.user)
                menu.days.all().delete()
            except WeeklyMenu.DoesNotExist:
                return Response({"error": "Menu not found."}, status=404)
        else:
            menu = WeeklyMenu.objects.create(user=request.user, name="This week")

        # Build shuffled pool (cycling if more days than recipes)
        shuffled_ids = shuffle_no_repeats([r.id for r in rotation_recipes])
        for i, day in enumerate(enabled_days):
            recipe_id = shuffled_ids[i % len(shuffled_ids)]
            MenuDay.objects.create(menu=menu, day=day, recipe_id=recipe_id)

        menu.refresh_from_db()
        serializer = WeeklyMenuSerializer(menu)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UpdateMenuDayView(APIView):
    """
    PATCH /api/menus/<menu_id>/days/<day>/
    Body: { "recipe_id": 42 }  — swap a single day's meal
    """

    def patch(self, request, menu_pk, day):
        try:
            menu = WeeklyMenu.objects.get(pk=menu_pk, user=request.user)
        except WeeklyMenu.DoesNotExist:
            return Response({"error": "Menu not found."}, status=404)

        recipe_id = request.data.get("recipe_id")
        recipe = None
        if recipe_id:
            try:
                recipe = Recipe.objects.get(pk=recipe_id, user=request.user)
            except Recipe.DoesNotExist:
                return Response({"error": "Recipe not found."}, status=404)

        MenuDay.objects.update_or_create(
            menu=menu, day=day, defaults={"recipe": recipe}
        )
        menu.refresh_from_db()
        return Response(WeeklyMenuSerializer(menu).data)
