import { useState } from "react";
import type { Recipe, WeeklyMenu, PantryItem, CookingDay } from "../../types";
import { menusApi } from "../../api";
import { T, COOKING_DAYS, RATING_LABELS, RATING_COLORS } from "../../lib/theme";
import { Btn } from "../../components/ui";

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  menu: WeeklyMenu | null;
  setMenu: React.Dispatch<React.SetStateAction<WeeklyMenu | null>>;
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

export function MenuPage({ recipes, menu, setMenu }: Props) {
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    COOKING_DAYS.forEach((d) => (o[d] = true));
    return o;
  });
  const [loading, setLoading] = useState(false);

  const rotRecipes = recipes.filter((r) => r.in_rotation);
  const activeDays = COOKING_DAYS.filter((d) => enabledDays[d]) as CookingDay[];
  const order1Days = activeDays.filter((_, i) => i < Math.ceil(activeDays.length / 2));
  const order2Days = activeDays.filter((_, i) => i >= Math.ceil(activeDays.length / 2));

  const handleGenerate = async () => {
    if (!rotRecipes.length) return;
    setLoading(true);
    try {
      const { data } = await menusApi.generate(activeDays, menu?.id);
      setMenu(data);
    } finally { setLoading(false); }
  };

  const getDayRecipe = (day: string): Recipe | null => {
    const dayObj = menu?.days.find((d) => d.day === day);
    return dayObj?.recipe ?? null;
  };

  if (!rotRecipes.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: T.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
      <p style={{ fontSize: 20, fontFamily: "'Playfair Display',serif", color: T.text, marginBottom: 6 }}>Rotation is empty</p>
      <p style={{ fontSize: 14 }}>Star recipes in the Recipe Bank to build your rotation</p>
    </div>
  );

  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: T.text }}>Weekly Menu</h3>
            <p style={{ margin: "3px 0 0", color: T.textMuted, fontSize: 13 }}>Toggle days, then generate. Shopping list updates automatically.</p>
          </div>
          <Btn onClick={handleGenerate} disabled={loading}>{loading ? "Generating..." : "🔀 Generate"}</Btn>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {COOKING_DAYS.map((d) => (
            <button key={d} onClick={() => setEnabledDays((e) => ({ ...e, [d]: !e[d] }))} style={{
              padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
              fontFamily: "'DM Mono',monospace", transition: "all .15s",
              background: enabledDays[d] ? T.accent : T.bg, color: enabledDays[d] ? "#000" : T.textMuted,
              border: `1px solid ${enabledDays[d] ? T.accent : T.border}`,
            }}>{d.slice(0, 3)}</button>
          ))}
          <span style={{ padding: "6px 14px", borderRadius: 20, background: T.tag, color: T.textFaint, fontSize: 12, fontFamily: "'DM Mono',monospace", border: `1px solid ${T.border}` }}>Sat 🍕</span>
        </div>
      </div>

      {menu && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
          {activeDays.map((day) => {
            const recipe = getDayRecipe(day);
            const isO1 = order1Days.includes(day);
            return (
              <div key={day} style={{ background: T.surface, border: `1px solid ${isO1 ? "#4a7c59" : "#3a5c8c"}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: isO1 ? T.green : T.blue, textTransform: "uppercase", letterSpacing: 1 }}>{day.slice(0, 3)}</span>
                  <span style={{ fontSize: 10, color: T.textFaint, fontFamily: "'DM Mono',monospace" }}>O{isO1 ? "1" : "2"}</span>
                </div>
                {recipe
                  ? <><p style={{ margin: "0 0 4px", color: T.text, fontFamily: "'Playfair Display',serif", fontSize: 14, lineHeight: 1.3 }}>{recipe.title}</p>{recipe.rating && <span style={{ fontSize: 11, color: RATING_COLORS[recipe.rating] }}>{RATING_LABELS[recipe.rating]}</span>}</>
                  : <p style={{ margin: 0, color: T.textFaint, fontSize: 13 }}>—</p>
                }
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
