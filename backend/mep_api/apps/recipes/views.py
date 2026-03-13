from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from .models import Recipe
from .serializers import RecipeSerializer, RecipeListSerializer
import anthropic
import json
import requests
from bs4 import BeautifulSoup


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

        # Fetch URL content if provided
        if url:
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
                resp = requests.get(url, headers=headers, timeout=10)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.content, "html.parser")
                
                # Remove script and style elements
                for script in soup(["script", "style", "nav", "footer"]):
                    script.decompose()
                
                # Get text
                text_content = soup.get_text(separator="\n")
                
                # Extract image URL (og:image or twitter:image)
                image_url = ""
                og_image = soup.find("meta", property="og:image")
                if og_image:
                    image_url = og_image.get("content", "")
                else:
                    tw_image = soup.find("meta", name="twitter:image")
                    if tw_image:
                        image_url = tw_image.get("content", "")

                # Clean up whitespace
                lines = (line.strip() for line in text_content.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = "\n".join(chunk for chunk in chunks if chunk)
                
                # Truncate if too long to avoid token limits (rough heuristic)
                if len(text) > 20000:
                    text = text[:20000] + "...(truncated)"
                    
            except Exception as e:
                return Response(
                    {"error": f"Failed to fetch URL: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        prompt = self._build_prompt(text)

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            raw = next(
                (b.text for b in message.content if b.type == "text"), ""
            )
            # Find JSON in response
            clean = raw.replace("```json", "").replace("```", "").strip()
            start = clean.find("{")
            end = clean.rfind("}")
            
            if start == -1 or end == -1:
                # Fallback: try to just parse the whole thing if no brackets found (unlikely but possible)
                if clean.strip().startswith("{") and clean.strip().endswith("}"):
                     parsed = json.loads(clean)
                else:
                    raise ValueError("No JSON found in response")
            else:
                parsed = json.loads(clean[start : end + 1])
                
            return Response(parsed, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Parse failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

    def _build_prompt(self, text: str) -> str:
        schema = (
            '{"title":"","description":"","image_url":"","servings":4,"prep_time":"","cook_time":"",'
            '"tags":[],"ingredients":[{"quantity":1.0,"unit":"cup","name":"flour"}],'
            '"steps":[{"instruction":"..."}]}'
        )
        return (
            f"Parse this recipe text and return ONLY valid JSON (no markdown):\n\n{text[:15000]}\n\n"
            f"Shape:\n{schema}\n"
            "Rules:\n"
            "1. quantity must be a float or null. Use null for 'to taste', garnish, or unspecified amounts.\n"
            "2. unit should be empty string for whole items (e.g. '1 onion' -> qty:1.0, unit:'', name:'onion').\n"
            "3. Return ONLY the JSON object, no preamble."
        )
