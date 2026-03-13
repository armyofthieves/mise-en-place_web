import { useState, useEffect } from "react";
import type { Recipe, WeeklyMenu, PantryItem, CookingDay, MenuDay } from "../../types";
import { menusApi } from "../../api";
import { T, COOKING_DAYS, RATING_LABELS, RATING_COLORS } from "../../lib/theme";
import { Btn } from "../../components/ui";
import { RecipeDetailModal } from "../../components/RecipeDetailModal";

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  menu: WeeklyMenu | null;
  setMenu: React.Dispatch<React.SetStateAction<WeeklyMenu | null>>;
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

export function MenuPage({ recipes, setRecipes, menu, setMenu, pantryItems }: Props) {
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    COOKING_DAYS.forEach((d) => (o[d] = true));
    return o;
  });
  const [eatOutDays, setEatOutDays] = useState<Record<string, boolean>>({});
  const [numWeeks, setNumWeeks] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);

  const rotRecipes = recipes.filter((r) => r.in_rotation);
  const activeDays = COOKING_DAYS.filter((d) => enabledDays[d] || eatOutDays[d]) as CookingDay[];
  const order1Days = activeDays.filter((_, i) => i < Math.ceil(activeDays.length / 2));
  const pantryNames = pantryItems.map((p) => p.name);

  // Sync currentWeek if menu changes (e.g. if weeks reduced)
  useEffect(() => {
    if (menu) {
      const maxWeek = Math.max(...menu.days.map(d => d.week), 1);
      if (currentWeek > maxWeek) setCurrentWeek(maxWeek);
    }
  }, [menu]);

  const handleGenerate = async () => {
    if (!rotRecipes.length) return;
    setLoading(true);
    try {
      // Map eatOutDays to list
      const eatOutList = COOKING_DAYS.filter(d => eatOutDays[d]);
      const { data } = await menusApi.generate(activeDays, numWeeks, menu?.id, eatOutList);
      setMenu(data);
      setCurrentWeek(1);
    } finally { setLoading(false); }
  };

  const handleToggleCookingDay = async (day: string) => {
    // 1. Toggle Enabled
    const isEnabled = enabledDays[day];
    const newState = !isEnabled;
    
    setEnabledDays(prev => ({ ...prev, [day]: newState }));
    
    // 2. If enabling cooking, disable eat out
    if (newState) {
        setEatOutDays(prev => ({ ...prev, [day]: false }));
        // Update live menu if exists
        if (menu) {
             const dayData = getDayData(day, currentWeek);
             if (dayData) {
                 // Set eat_out to false. We don't necessarily set a recipe here, 
                 // we just say "it's not eat out". 
                 // If it was eat out, it might not have a recipe. 
                 // But the user said "without having to regenerate". 
                 // If we switch from Eat Out -> Cooking, and there's no recipe, we might need to pick one? 
                 // Or just leave it empty? For now, just unset eat_out flag.
                 const { data } = await menusApi.updateDay(menu.id, dayData.week, dayData.day, { is_eat_out: false });
                 setMenu(data);
             }
        }
    }
  };

  const handleToggleEatOutDay = async (day: string) => {
    // 1. Toggle Eat Out
    const isEatOut = eatOutDays[day];
    const newState = !isEatOut;
    
    setEatOutDays(prev => ({ ...prev, [day]: newState }));
    
    // 2. If enabling eat out, disable cooking
    if (newState) {
        setEnabledDays(prev => ({ ...prev, [day]: false }));
        // Update live menu if exists
        if (menu) {
             const dayData = getDayData(day, currentWeek);
             if (dayData) {
                 const { data } = await menusApi.updateDay(menu.id, dayData.week, dayData.day, { is_eat_out: true });
                 setMenu(data);
             }
        }
    } else {
        // If disabling eat out (and not enabling cooking explicitly), 
        // we essentially just turn off the flag. 
        // Note: Disabling eat out via this button doesn't automatically enable cooking in my logic above, 
        // but maybe it should? The user said "selecting the take out day would deselect the cooking day".
        // Conversely, deselecting take out... doesn't necessarily mean cooking.
        // But for live update, we should sync the menu.
        if (menu) {
             const dayData = getDayData(day, currentWeek);
             if (dayData) {
                 const { data } = await menusApi.updateDay(menu.id, dayData.week, dayData.day, { is_eat_out: false });
                 setMenu(data);
             }
        }
    }
  };

  const handleUpdate = (r: Recipe) => setRecipes((p) => p.map((x) => x.id === r.id ? r : x));

  const toggleLock = async (e: React.MouseEvent, day: MenuDay) => {
    e.stopPropagation();
    if (!menu) return;
    const { data } = await menusApi.updateDay(menu.id, day.week, day.day, { is_locked: !day.is_locked });
    setMenu(data);
  };

  const getDayData = (day: string, week: number): MenuDay | undefined => {
    return menu?.days.find((d) => d.day === day && d.week === week);
  };

  if (!rotRecipes.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: T.textMuted }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
      <p style={{ fontSize: 20, fontFamily: "'Playfair Display',serif", color: T.text, marginBottom: 6 }}>Rotation is empty</p>
      <p style={{ fontSize: 14 }}>Star recipes in the Recipe Bank to build your rotation</p>
    </div>
  );

  const maxWeeks = menu ? Math.max(...menu.days.map(d => d.week), 1) : 1;

  return (
    <div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: T.text }}>Weekly Menu</h3>
            <p style={{ margin: "3px 0 0", color: T.textMuted, fontSize: 13 }}>Configure days & duration, then generate.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: T.textMuted, fontFamily: "'DM Mono',monospace" }}>DURATION:</span>
                <div style={{ display: "flex", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
                    {[1, 2, 3, 4].map(w => (
                        <button key={w} onClick={() => setNumWeeks(w)} style={{
                            padding: "4px 10px", background: numWeeks === w ? T.accent : T.bg, color: numWeeks === w ? "#000" : T.textMuted,
                            border: "none", borderRight: w < 4 ? `1px solid ${T.border}` : "none", cursor: "pointer", fontSize: 12, fontFamily: "'DM Mono',monospace"
                        }}>{w}W</button>
                    ))}
                </div>
             </div>
             <Btn onClick={handleGenerate} disabled={loading}>{loading ? "Generating..." : "🔀 Generate"}</Btn>
          </div>
        </div>
        
        <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 6 }}>COOKING DAYS:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COOKING_DAYS.map((d) => (
                <button key={d} onClick={() => handleToggleCookingDay(d)} style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                fontFamily: "'DM Mono',monospace", transition: "all .15s",
                background: enabledDays[d] ? T.accent : T.bg, color: enabledDays[d] ? "#000" : T.textMuted,
                border: `1px solid ${enabledDays[d] ? T.accent : T.border}`,
                }}>{d.slice(0, 3)}</button>
            ))}
            </div>
        </div>

        <div>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 6 }}>EAT OUT / TAKEOUT (Planned):</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COOKING_DAYS.map((d) => (
                <button key={d} onClick={() => handleToggleEatOutDay(d)} style={{
                padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                fontFamily: "'DM Mono',monospace", transition: "all .15s",
                background: eatOutDays[d] ? T.blue : T.bg, color: eatOutDays[d] ? "#fff" : T.textMuted,
                border: `1px solid ${eatOutDays[d] ? T.blue : T.border}`,
                }}>{d.slice(0, 3)}</button>
            ))}
            </div>
        </div>
      </div>

      {menu && maxWeeks > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${T.border}` }}>
            {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(w => (
                <button key={w} onClick={() => setCurrentWeek(w)} style={{
                    padding: "8px 16px", background: "none", border: "none", borderBottom: `2px solid ${currentWeek === w ? T.accent : "transparent"}`,
                    color: currentWeek === w ? T.text : T.textMuted, cursor: "pointer", fontSize: 14, fontFamily: "'DM Mono',monospace", marginBottom: -1
                }}>Week {w}</button>
            ))}
        </div>
      )}

      {menu && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {activeDays.map((day) => {
            const dayData = getDayData(day, currentWeek);
            const recipe = dayData?.recipe;
            const isO1 = order1Days.includes(day);
            const isLocked = dayData?.is_locked;
            const isEatOut = dayData?.is_eat_out;

            return (
              <div key={day} 
                onClick={() => !isEatOut && recipe && setDetail(recipe)}
                style={{ 
                  background: T.surface, 
                  border: `1px solid ${isEatOut ? T.blue : (isO1 ? "#4a7c59" : "#3a5c8c")}`, 
                  borderRadius: 10, 
                  padding: 14,
                  cursor: (isEatOut || recipe) ? "pointer" : "default",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  opacity: 1,
                  position: "relative"
                }}
                onMouseEnter={(e) => (isEatOut || recipe) && (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => (isEatOut || recipe) && (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: isEatOut ? T.blue : (isO1 ? T.green : T.blue), textTransform: "uppercase", letterSpacing: 1 }}>{day.slice(0, 3)}</span>
                    {!isEatOut && <span style={{ fontSize: 10, color: T.textFaint, fontFamily: "'DM Mono',monospace", marginLeft: 6 }}>O{isO1 ? "1" : "2"}</span>}
                  </div>
                  {dayData && (
                      <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={(e) => toggleLock(e, dayData)} title="Lock Day" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: isLocked ? 1 : 0.3 }}>🔒</button>
                      </div>
                  )}
                </div>
                
                {isEatOut ? (
                    <div style={{ height: 40, display: "flex", alignItems: "center", color: T.blue, fontStyle: "italic", fontSize: 14 }}>
                        🥡 Eat Out / Takeout
                    </div>
                ) : (
                    recipe
                    ? (
                      <>
                        {recipe.image_url && (
                          <div style={{ height: 80, margin: "0 -14px 10px", overflow: "hidden", position: "relative" }}>
                             <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.currentTarget.style.display = "none"} />
                             <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)" }} />
                          </div>
                        )}
                        <p style={{ margin: "0 0 4px", color: T.text, fontFamily: "'Playfair Display',serif", fontSize: 15, lineHeight: 1.3 }}>{recipe.title}</p>
                        {recipe.rating && <span style={{ fontSize: 11, color: RATING_COLORS[recipe.rating] }}>{RATING_LABELS[recipe.rating]}</span>}
                      </>
                    )
                    : <p style={{ margin: 0, color: T.textFaint, fontSize: 13 }}>—</p>
                )}
              </div>
            );
          })}
        </div>
      )}

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
