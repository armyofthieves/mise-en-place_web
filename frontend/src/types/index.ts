// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  username: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ─── Recipes ──────────────────────────────────────────────────────────────────
export type Rating = "loved" | "okay" | "skip";

export interface Ingredient {
  id?: number;
  name: string;
  quantity: number | null;
  unit: string;
  order?: number;
}

export interface RecipeStep {
  id?: number;
  instruction: string;
  order?: number;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  source_url: string | null;
  image_url?: string | null;
  servings: number;
  prep_time: string;
  cook_time: string;
  rating: Rating | null;
  in_rotation: boolean;
  tags: string[];
  ingredients: Ingredient[];
  steps?: RecipeStep[];
  created_at: string;
  updated_at?: string;
}

export type RecipeCreate = Omit<Recipe, "id" | "created_at" | "updated_at">;

// ─── Parsed recipe from AI ───────────────────────────────────────────────────
export interface ParsedRecipe {
  title: string;
  description: string;
  image_url?: string;
  servings: number;
  prep_time: string;
  cook_time: string;
  tags: string[];
  ingredients: Array<{ quantity: number | null; unit: string; name: string }>;
  steps: Array<{ instruction: string }>;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────
export type CookingDay = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface MenuDay {
  id: number;
  day: CookingDay;
  recipe: Recipe | null;
  recipe_id?: number | null;
  week: number;
  is_locked: boolean;
  is_eat_out: boolean;
}

export interface WeeklyMenu {
  id: number;
  name: string;
  days: MenuDay[];
  created_at: string;
  updated_at: string;
}

// ─── Pantry ───────────────────────────────────────────────────────────────────
export interface PantryItem {
  id: number;
  name: string;
  created_at: string;
}

// ─── Shopping list (client-side derived type) ─────────────────────────────────
export interface ShoppingIngredient {
  name: string;
  quantity: number | null;
  unit: string;
}
