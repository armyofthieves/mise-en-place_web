from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import Recipe
from .serializers import RecipeSerializer, RecipeListSerializer
import anthropic
import json


class RecipeListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return RecipeSerializer
        return RecipeListSerializer

    def get_queryset(self):
        return Recipe.objects.filter(user=self.request.user).prefetch_related(
            "ingredients", "steps"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecipeSerializer

    def get_queryset(self):
        return Recipe.objects.filter(user=self.request.user).prefetch_related(
            "ingredients", "steps"
        )


class ParseRecipeView(APIView):
    """
    POST /api/recipes/parse/
    Body: { "url": "https://..." }  OR  { "text": "raw recipe text" }
    Returns a parsed recipe object ready to POST to /api/recipes/
    """

    def post(self, request):
        url = request.data.get("url", "")
        text = request.data.get("text", "")

        if not url and not text:
            return Response(
                {"error": "Provide either 'url' or 'text'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.ANTHROPIC_API_KEY:
            return Response(
                {"error": "ANTHROPIC_API_KEY not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        prompt = self._build_prompt(url, text)

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            tools = (
                [{"type": "web_search_20250305", "name": "web_search"}] if url else None
            )

            kwargs = dict(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            if tools:
                kwargs["tools"] = tools

            message = client.messages.create(**kwargs)

            raw = next(
                (b.text for b in message.content if b.type == "text"), ""
            )
            clean = raw.replace("```json", "").replace("```", "").strip()
            start, end = clean.find("{"), clean.rfind("}")
            parsed = json.loads(clean[start : end + 1])
            return Response(parsed, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Parse failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

    def _build_prompt(self, url: str, text: str) -> str:
        schema = (
            '{"title":"","description":"","servings":4,"prep_time":"","cook_time":"",'
            '"tags":[],"ingredients":[{"quantity":1,"unit":"cup","name":"flour"}],'
            '"steps":[{"instruction":"..."}]}'
        )
        if url:
            return (
                f"Fetch and parse this recipe URL: {url}\n\n"
                f"Return ONLY valid JSON (no markdown) matching this shape:\n{schema}\n"
                "quantity is a float or null. Return ONLY the JSON object."
            )
        return (
            f"Parse this recipe text and return ONLY valid JSON (no markdown):\n{text}\n\n"
            f"Shape:\n{schema}\nReturn ONLY the JSON object."
        )
