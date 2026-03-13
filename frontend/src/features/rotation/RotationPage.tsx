// ─── RotationPage.tsx ─────────────────────────────────────────────────────────
import { useState } from "react";
import type { Recipe, WeeklyMenu, PantryItem } from "../../types";
import { recipesApi } from "../../api";
import { T, RATING_LABELS, RATING_COLORS } from "../../lib/theme";
import { Tag } from "../../components/ui";
import { RecipeDetailModal } from "../../components/RecipeDetailModal";

interface SharedProps {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  menu: WeeklyMenu | null;
  setMenu: React.Dispatch<React.SetStateAction<WeeklyMenu | null>>;
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

function RecipeCard({ recipe, inRotation, onToggleRotation, onClick }: {
  recipe: Recipe; inRotation: boolean; onToggleRotation: () => void; onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color .2s, transform .2s", display: "flex", flexDirection: "column" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
      {recipe.image_url && (
        <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
             <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.currentTarget.style.display = "none"} />
             <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
        </div>
      )}
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display',serif", color: T.text, fontSize: 16, lineHeight: 1.3, flex: 1 }}>{recipe.title}</h3>
            <button onClick={(e) => { e.stopPropagation(); onToggleRotation(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: inRotation ? T.accent : T.textFaint, padding: "2px 4px", lineHeight: 1, transition: "color .2s" }}>★</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            {recipe.prep_time && <span style={{ color: T.textMuted, fontSize: 12 }}>⏱ {recipe.prep_time}</span>}
            {recipe.cook_time && <span style={{ color: T.textMuted, fontSize: 12 }}>🍳 {recipe.cook_time}</span>}
        </div>
        {recipe.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>{recipe.tags.slice(0, 3).map((t) => <Tag key={t} label={t} />)}</div>}
        {recipe.rating && <span style={{ fontSize: 12, color: RATING_COLORS[recipe.rating], marginTop: "auto" }}>{RATING_LABELS[recipe.rating]}</span>}
      </div>
    </div>
  );
}

export function RotationPage({ recipes, setRecipes, pantryItems }: SharedProps) {
  const [detail, setDetail] = useState<Recipe | null>(null);
  const rotRecipes = recipes.filter((r) => r.in_rotation);
  const pantryNames = pantryItems.map((p) => p.name);

  const handleToggle = async (recipe: Recipe) => {
    const { data } = await recipesApi.update(recipe.id, { in_rotation: !recipe.in_rotation });
    setRecipes((p) => p.map((x) => x.id === data.id ? data : x));
  };
  
  const handleUpdate = (r: Recipe) => setRecipes((p) => p.map((x) => x.id === r.id ? r : x));

  const groups = {
    loved: rotRecipes.filter((r) => r.rating === "loved"),
    okay: rotRecipes.filter((r) => r.rating === "okay"),
    unrated: rotRecipes.filter((r) => !r.rating),
    skip: rotRecipes.filter((r) => r.rating === "skip"),
  };

  if (!rotRecipes.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: T.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
      <p style={{ fontSize: 20, fontFamily: "'Playfair Display',serif", color: T.text, marginBottom: 6 }}>No meals in rotation</p>
      <p style={{ fontSize: 14 }}>Star recipes in the Recipe Bank to add them here</p>
    </div>
  );

  const Section = ({ label, color, items }: { label: string; color: string; items: Recipe[] }) =>
    !items.length ? null : (
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ color, fontFamily: "'DM Mono',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>{label}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {items.map((r) => <RecipeCard key={r.id} recipe={r} inRotation onClick={() => setDetail(r)} onToggleRotation={() => handleToggle(r)} />)}
        </div>
      </div>
    );

  return (
    <div>
      <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 20 }}>{rotRecipes.length} meal{rotRecipes.length !== 1 ? "s" : ""} in rotation</p>
      <Section label="❤️ Loved It" color={T.red} items={groups.loved} />
      <Section label="👍 It Was Okay" color={T.accent} items={groups.okay} />
      <Section label="Unrated" color={T.textMuted} items={groups.unrated} />
      <Section label="🚫 Skip" color={T.textFaint} items={groups.skip} />
      
      {detail && <RecipeDetailModal 
        recipe={detail} 
        onClose={() => setDetail(null)} 
        onUpdate={(r) => { handleUpdate(r); setDetail(r); }} 
        onDelete={(id) => setRecipes(p => p.filter(r => r.id !== id))}
        pantryNames={pantryNames} 
      />}
    </div>
  );
}
