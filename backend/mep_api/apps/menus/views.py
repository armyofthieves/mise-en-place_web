import random
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WeeklyMenu, MenuDay
from .serializers import WeeklyMenuSerializer
from mep_api.apps.recipes.models import Recipe

COOKING_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def shuffle_no_repeats(items: list) -> list:
    """Shuffle a list ensuring no two identical adjacent items."""
    if not items:
        return []
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
    Body: { 
        "enabled_days": ["Sunday", "Monday", ...], 
        "eat_out_days": ["Friday"],  # Days designated for eating out
        "weeks": 1,
        "menu_id": 1 (optional) 
    }

    Creates (or replaces) a WeeklyMenu.
    - Respects 'is_locked' days (does not change them).
    - Sets 'is_eat_out' for days in eat_out_days (unless locked).
    - Fills remaining days with rotation recipes, shuffled with no adjacent repeats.
    """

    def post(self, request):
        enabled_days = request.data.get("enabled_days", COOKING_DAYS)
        eat_out_days = set(request.data.get("eat_out_days", []))
        weeks = int(request.data.get("weeks", 1))
        menu_id = request.data.get("menu_id")

        # Normalize enabled days to a list of (week, day_name) tuples
        # If weeks=1, keys are just day names. But we need to support multi-week.
        # Let's standardize on (week, day_name)
        target_slots = []
        for w in range(1, weeks + 1):
            for day in enabled_days:
                target_slots.append((w, day))

        rotation_recipes = list(
            Recipe.objects.filter(user=request.user, in_rotation=True)
        )

        if not rotation_recipes:
            return Response(
                {"error": "No recipes in rotation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not target_slots:
            return Response(
                {"error": "No days enabled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create the menu
        if menu_id:
            try:
                menu = WeeklyMenu.objects.get(pk=menu_id, user=request.user)
            except WeeklyMenu.DoesNotExist:
                return Response({"error": "Menu not found."}, status=404)
        else:
            menu = WeeklyMenu.objects.create(user=request.user, name="This week")

        # Get existing days to check for locks
        existing_days = {
            (d.week, d.day): d for d in MenuDay.objects.filter(menu=menu)
        }

        # Determine which slots need filling
        slots_to_fill = []
        
        # Prepare Recipe Pool
        # We want to minimize repeats. 
        # Ideally, we create a long shuffled list of recipes that spans all the slots we need.
        recipe_pool = []
        
        # Calculate how many recipes we need
        needed_count = 0
        for slot in target_slots:
            week, day_name = slot
            existing = existing_days.get(slot)
            
            # If locked, skip
            if existing and existing.is_locked:
                continue
            
            # If eat out, we don't need a recipe (unless we want to support eat out + recipe?)
            # Usually eat out means no cooking.
            # However, we must decide if this slot IS eat out.
            # The user request implies eat_out_days is a configuration "Monday is eat out".
            # If multi-week, presumably "Monday" means "Monday of every week".
            # Or we could just check if day_name is in eat_out_days.
            if day_name in eat_out_days:
                continue

            needed_count += 1

        # Build the pool
        while len(recipe_pool) < needed_count:
            recipe_pool.extend(shuffle_no_repeats([r.id for r in rotation_recipes]))
        
        # Trim to exact size (optional, but clean)
        recipe_pool = recipe_pool[:needed_count]
        pool_idx = 0

        # Process all target slots
        # We also need to remove days that are NO LONGER in target_slots (e.g. user reduced weeks or disabled a day)
        # But only if they are not locked? 
        # Actually, if user disables a day, we should probably remove it even if locked, 
        # OR we just keep it but it won't be shown if frontend filters by enabled.
        # The clean way is: sync DB to target_slots.
        
        # 1. Delete days not in target_slots (unless we want to keep history? No, this is a "plan".)
        # Construct set of valid (week, day) keys
        valid_keys = set(target_slots)
        for key, day_obj in existing_days.items():
            if key not in valid_keys:
                day_obj.delete()

        # 2. Update/Create days
        for slot in target_slots:
            week, day_name = slot
            existing = existing_days.get(slot)

            # Locked: Keep as is
            if existing and existing.is_locked:
                continue
            
            # Eat Out: Update or Create
            if day_name in eat_out_days:
                MenuDay.objects.update_or_create(
                    menu=menu, 
                    week=week, 
                    day=day_name, 
                    defaults={
                        "is_eat_out": True, 
                        "recipe": None,
                        "is_locked": False # Reset lock if we force eat out? Or keep it? 
                                           # User said "eat out functionality should be moved to configuration". 
                                           # If I configure Monday as Eat Out, it overrides the meal.
                    }
                )
                continue
            
            # Cooking Day: Update or Create
            recipe_id = recipe_pool[pool_idx]
            pool_idx += 1
            
            MenuDay.objects.update_or_create(
                menu=menu,
                week=week,
                day=day_name,
                defaults={
                    "is_eat_out": False,
                    "recipe_id": recipe_id,
                    "is_locked": False # Reset lock? If it wasn't locked before (checked above), it's false. 
                                       # If it was existing and not locked, we are overwriting it.
                }
            )

        menu.refresh_from_db()
        serializer = WeeklyMenuSerializer(menu)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UpdateMenuDayView(APIView):
    """
    PATCH /api/menus/<menu_id>/days/<week>/<day>/
    Body: { "recipe_id": 42, "is_locked": bool, "is_eat_out": bool }
    """

    def patch(self, request, menu_pk, week, day):
        try:
            menu = WeeklyMenu.objects.get(pk=menu_pk, user=request.user)
        except WeeklyMenu.DoesNotExist:
            return Response({"error": "Menu not found."}, status=404)

        data = request.data
        defaults = {}

        if "recipe_id" in data:
            if data["recipe_id"] is None:
                defaults["recipe"] = None
            else:
                try:
                    defaults["recipe"] = Recipe.objects.get(pk=data["recipe_id"], user=request.user)
                except Recipe.DoesNotExist:
                    return Response({"error": "Recipe not found."}, status=404)

        if "is_locked" in data:
            defaults["is_locked"] = data["is_locked"]
        
        if "is_eat_out" in data:
            defaults["is_eat_out"] = data["is_eat_out"]
            # If setting eat out to true, typically we might clear the recipe, or keep it hidden.
            # Frontend logic handles display. Backend can keep it or clear it.
            # Let's clear it if eat_out is True to be clean? 
            # Or keep it so toggling eat_out off restores the meal? 
            # User said: "toggle... not on a day that already has a menu item". 
            # But they also said "user should be able to select by day if there is a takeout/eat out day".
            # I'll stick to just updating the flag.

        MenuDay.objects.update_or_create(
            menu=menu, week=week, day=day, defaults=defaults
        )
        menu.refresh_from_db()
        return Response(WeeklyMenuSerializer(menu).data)
