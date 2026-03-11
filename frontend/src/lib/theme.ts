// ─── Theme ────────────────────────────────────────────────────────────────────
export const T = {
  bg: "#0f0f0f",
  surface: "#1a1a1a",
  surfaceHover: "#222",
  border: "#2a2a2a",
  accent: "#e8c547",
  text: "#f0ede6",
  textMuted: "#888",
  textFaint: "#444",
  red: "#e05c5c",
  green: "#5cb87a",
  blue: "#5c87b8",
  tag: "#1f1f1f",
} as const;

// ─── Constants ────────────────────────────────────────────────────────────────
export const COOKING_DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
] as const;

export const AVAILABLE_TAGS = [
  "Quick (<30 min)", "Vegetarian", "Comfort Food", "Healthy",
  "Date Night", "Batch Cook", "Spicy", "Asian", "Italian", "Mexican",
];

export const PANTRY_DEFAULTS = [
  "salt", "pepper", "olive oil", "vegetable oil", "water", "butter",
  "flour", "sugar", "garlic powder", "onion powder", "paprika", "cumin",
  "oregano", "thyme", "bay leaves", "soy sauce", "vinegar",
  "baking soda", "baking powder", "eggs", "milk",
];

export const RATING_LABELS: Record<string, string> = {
  loved: "❤️ Loved it",
  okay: "👍 It was okay",
  skip: "🚫 Skip it",
};

export const RATING_COLORS: Record<string, string> = {
  loved: T.red,
  okay: T.accent,
  skip: T.textMuted,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatQty(qty: number | null): string {
  if (qty == null) return "";
  if (qty === Math.floor(qty)) return String(qty);
  const fracs: [number, string][] = [
    [0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.667, "⅔"], [0.75, "¾"],
  ];
  const whole = Math.floor(qty);
  const frac = qty - whole;
  for (const [v, s] of fracs) {
    if (Math.abs(frac - v) < 0.05) return (whole > 0 ? String(whole) : "") + s;
  }
  return qty.toFixed(1).replace(/\.0$/, "");
}

export function isPantryIngredient(name: string, pantryItems: string[]): boolean {
  return pantryItems.some((p) => name.toLowerCase().includes(p.toLowerCase()));
}

export interface MergedIngredient {
  name: string;
  quantity: number | null;
  unit: string;
}

export function mergeIngredients(
  ingredientLists: Array<Array<{ name: string; quantity: number | null; unit: string }>>
): MergedIngredient[] {
  const map = new Map<string, MergedIngredient>();
  for (const list of ingredientLists) {
    for (const ing of list) {
      const key = ing.name.toLowerCase().trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...ing });
      } else if (existing.quantity != null && ing.quantity != null) {
        map.set(key, { ...existing, quantity: Math.round((existing.quantity + ing.quantity) * 100) / 100 });
      } else {
        map.set(key, { ...existing, quantity: null });
      }
    }
  }
  return Array.from(map.values());
}
