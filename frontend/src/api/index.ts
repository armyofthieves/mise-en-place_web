import axios from "axios";
import type {
  AuthTokens, User, Recipe, RecipeCreate, ParsedRecipe,
  WeeklyMenu, PantryItem, CookingDay,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({ baseURL: BASE });

// ─── JWT Interceptor ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post<{ access: string }>(
            `${BASE}/auth/refresh/`,
            { refresh }
          );
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<User>("/auth/register/", { email, username, password }),

  login: async (email: string, password: string): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>("/auth/login/", { email, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  me: () => api.get<User>("/auth/me/"),
};

// ─── Recipes ─────────────────────────────────────────────────────────────────
export const recipesApi = {
  list: () => api.get<Recipe[]>("/recipes/"),
  get: (id: number) => api.get<Recipe>(`/recipes/${id}/`),
  create: (data: RecipeCreate) => api.post<Recipe>("/recipes/", data),
  update: (id: number, data: Partial<RecipeCreate>) =>
    api.patch<Recipe>(`/recipes/${id}/`, data),
  delete: (id: number) => api.delete(`/recipes/${id}/`),
  parse: (payload: { url?: string; text?: string }) =>
    api.post<ParsedRecipe>("/recipes/parse/", payload),
};

// ─── Menus ────────────────────────────────────────────────────────────────────
export const menusApi = {
  list: () => api.get<WeeklyMenu[]>("/menus/"),
  get: (id: number) => api.get<WeeklyMenu>(`/menus/${id}/`),
  generate: (enabledDays: CookingDay[], menuId?: number) =>
    api.post<WeeklyMenu>("/menus/generate/", {
      enabled_days: enabledDays,
      menu_id: menuId,
    }),
  updateDay: (menuId: number, day: CookingDay, recipeId: number | null) =>
    api.patch<WeeklyMenu>(`/menus/${menuId}/days/${day}/`, { recipe_id: recipeId }),
};

// ─── Pantry ───────────────────────────────────────────────────────────────────
export const pantryApi = {
  list: () => api.get<PantryItem[]>("/auth/pantry/"),
  add: (name: string) => api.post<PantryItem>("/auth/pantry/", { name }),
  remove: (id: number) => api.delete(`/auth/pantry/${id}/`),
};
