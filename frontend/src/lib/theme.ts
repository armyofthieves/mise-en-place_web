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
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
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
  if (Math.abs(qty - Math.round(qty)) < 0.01) return String(Math.round(qty));
  
  const fracs: [number, string][] = [
    [0.25, "1/4"], [0.33, "1/3"], [0.333, "1/3"], [0.5, "1/2"], 
    [0.66, "2/3"], [0.666, "2/3"], [0.667, "2/3"], [0.75, "3/4"],
    [0.125, "1/8"], [0.375, "3/8"], [0.625, "5/8"], [0.875, "7/8"],
    [0.2, "1/5"], [0.4, "2/5"], [0.6, "3/5"], [0.8, "4/5"]
  ];
  
  const whole = Math.floor(qty);
  const frac = qty - whole;
  
  // Check for exact fraction match
  for (const [v, s] of fracs) {
    if (Math.abs(frac - v) < 0.05) return (whole > 0 ? `${whole} ${s}` : s);
  }
  
  // Formatting for decimals if no fraction found
  return Number(qty.toFixed(2)).toString();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getMatchingPantryItems(ingredientName: string, pantryItems: { name: string, id: number }[]): { name: string, id: number }[] {
  const norm = ingredientName.toLowerCase();
  // Find all pantry items that are contained within the ingredient name as whole words
  // e.g. "Chicken" matches "Chicken Breast" but "Oil" does NOT match "Boiled Potato"
  return pantryItems.filter((p) => {
    const pName = p.name.trim();
    if (!pName) return false;
    // Escape the pantry item name and wrap in word boundaries
    const regex = new RegExp(`\\b${escapeRegExp(pName)}\\b`, 'i');
    return regex.test(norm);
  });
}

export function isPantryIngredient(name: string, pantryItems: string[]): boolean {
  // Backwards compatibility wrapper
  const pItems = pantryItems.map(n => ({ name: n, id: 0 }));
  return getMatchingPantryItems(name, pItems).length > 0;
}

export interface MergedIngredient {
  name: string;
  quantity: number | null;
  unit: string;
  originalNames?: string[];
}

// Words to strip for normalization
const PREP_WORDS = [
  "boneless", "skinless", "skin", "on", "chopped", "diced", "sliced", "minced", "crushed", "grated",
  "peeled", "seeded", "cored", "thawed", "divided", "separated", "beaten", "whisked",
  "melted", "softened", "toasted", "roasted", "cooked", "uncooked", "raw",
  "fresh", "large", "small", "medium", "whole", "lean", "extra", "virgin",
  "cut into", "cut", "into", "pieces", "cubes", "chunks", "slices", "wedges", "florets", "fillets", "strips",
  "bite", "size", "sized", "inch", "inches", "cm", "mm", "halves", "quarters", "roughly", "finely",
  "thick", "thin", "cubed", "shredded", "fillet", "fillets", "strip", "strips", "piece", "pieces",
  "garnish", "optional", "to taste", "pinch", "dash", "clove", "head", "stalk", "stick",
  "can", "cans", "jar", "jars", "bottle", "bottles", "package", "packages", "bag", "bags", "box", "boxes", "container", "containers", "bunch", "bunches",
  "cup", "cups", "tablespoon", "tablespoons", "teaspoon", "teaspoons", "pound", "pounds", "ounce", "ounces", "gram", "grams", "kg", "lb", "lbs", "oz", "tbsp", "tsp",
  "of", "and", "with", "in"
];

export function normalizeIngredient(name: string): string {
  let norm = name.toLowerCase();
  
  // Remove text in parentheses
  norm = norm.replace(/\([^)]*\)/g, "");
  
  // Remove numbers and dimensions (e.g. "1-inch", "1/2 inch", "2 oz", "3")
  // Matches digits followed optionally by separator (including / for fractions) and units, or just digits
  norm = norm.replace(/\b\d+([\s-./]\d+)*\s*(inch|inches|cm|mm|oz|lb|lbs|g|kg)?\b/g, " ");

  // Remove special chars INCLUDING all hyphen/dash variants
  // \u2013 (en dash), \u2014 (em dash), \u2212 (minus)
  norm = norm.replace(/[,;.\-–—\u2013\u2014\u2212]/g, " ");
  
  // Normalize whitespace
  norm = norm.replace(/\s+/g, " ").trim();

  // Try to strip prep words
  const words = norm.split(" ");
  const filtered = words.filter(w => !PREP_WORDS.includes(w) && w.length > 1); // Also filter single chars like "a"
  
  if (filtered.length > 0) {
    // Basic singularization
    const result = filtered.join(" ");
    if (result.endsWith("ies")) return result.slice(0, -3) + "y"; // berries -> berry
    if (result.endsWith("s") && !result.endsWith("ss")) return result.slice(0, -1);
    return result;
  }
  
  return norm;
}

export function mergeIngredients(
  ingredientLists: Array<Array<{ name: string; quantity: number | null; unit: string }>>
): MergedIngredient[] {
  const map = new Map<string, MergedIngredient>();
  
  for (const list of ingredientLists) {
    for (const ing of list) {
      // Normalize name for grouping
      const key = normalizeIngredient(ing.name);
      
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...ing, name: key, originalNames: [ing.name] }); // Use normalized name as display name? Or keep original?
        // Using normalized name as display name makes the list cleaner ("chicken breast" vs "boneless skinless...")
        // But might lose info. Let's try normalized first as requested to "account as one item".
      } else {
        const newQty = (existing.quantity || 0) + (ing.quantity || 0);
        map.set(key, { 
          ...existing, 
          quantity: newQty || null,
          originalNames: [...(existing.originalNames || []), ing.name]
        });
      }
    }
  }
  
  // Convert map to array and try to pick the best display name if needed?
  // For now, let's stick with the key (normalized) as the name to ensure they show as one line item.
  // We can convert the key to Title Case for better display.
  
  return Array.from(map.values()).map(i => ({
    ...i,
    name: i.name.charAt(0).toUpperCase() + i.name.slice(1)
  }));
}

export const PANTRY_CATEGORIES: Record<string, string[]> = {
  "Produce": ["onion", "garlic", "potato", "lemon", "lime", "ginger", "shallot", "scallion", "carrot", "celery"],
  "Baking & Grains": ["flour", "sugar", "baking", "yeast", "cornstarch", "oats", "rice", "pasta", "quinoa", "bread", "crumb"],
  "Oils, Vinegars & Sauces": ["oil", "vinegar", "sauce", "shoyu", "tamari", "mustard", "mayo", "ketchup", "honey", "syrup", "dressing"],
  "Spices & Seasonings": ["salt", "pepper", "spice", "herb", "powder", "paprika", "cumin", "oregano", "thyme", "cinnamon", "nutmeg", "vanilla", "extract", "seasoning", "bay leaf"],
  "Canned & Jarred": ["can", "jar", "stock", "broth", "paste", "tomato", "bean", "chickpea", "lentil", "coconut milk"],
  "Dairy & Fridge": ["milk", "butter", "egg", "cheese", "yogurt", "cream"],
  "Frozen": ["frozen", "ice"],
};

export function getPantryCategory(name: string): string {
  const n = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(PANTRY_CATEGORIES)) {
    if (keywords.some(k => n.includes(k))) return cat;
  }
  return "Miscellaneous";
}
