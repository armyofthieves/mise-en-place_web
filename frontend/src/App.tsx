import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./features/auth/AuthPage";
import { RecipesPage } from "./features/recipes/RecipesPage";
import { RotationPage } from "./features/rotation/RotationPage";
import { MenuPage } from "./features/menu/MenuPage";
import { ShoppingPage } from "./features/shopping/ShoppingPage";
import { PantryPage } from "./features/pantry/PantryPage";
import { recipesApi } from "./api";
import type { Recipe, WeeklyMenu, PantryItem } from "./types";
import { pantryApi, menusApi } from "./api";
import { PANTRY_DEFAULTS } from "./lib/theme";

function ProtectedApp() {
  const { user, loading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      recipesApi.list(),
      menusApi.list(),
      pantryApi.list(),
    ]).then(([rRes, mRes, pRes]) => {
      setRecipes(rRes.data);
      setMenu(mRes.data[0] ?? null);
      // Seed pantry defaults on first load
      if (pRes.data.length === 0) {
        Promise.all(PANTRY_DEFAULTS.map((name) => pantryApi.add(name)))
          .then(() => pantryApi.list().then((r) => setPantryItems(r.data)));
      } else {
        setPantryItems(pRes.data);
      }
    }).finally(() => setDataLoading(false));
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0f0f0f", color: "#888", fontFamily: "sans-serif", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const rotationCount = recipes.filter((r) => r.in_rotation).length;

  const sharedProps = {
    recipes, setRecipes, menu, setMenu, pantryItems, setPantryItems,
  };

  return (
    <AppLayout rotationCount={rotationCount}>
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route path="/recipes"  element={<RecipesPage  {...sharedProps} />} />
        <Route path="/rotation" element={<RotationPage {...sharedProps} />} />
        <Route path="/menu"     element={<MenuPage     {...sharedProps} />} />
        <Route path="/shopping" element={<ShoppingPage {...sharedProps} />} />
        <Route path="/pantry"   element={<PantryPage   {...sharedProps} />} />
        <Route path="*"         element={<Navigate to="/recipes" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*"     element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
