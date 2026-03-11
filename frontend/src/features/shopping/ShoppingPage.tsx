import { useState } from "react";
import type { Recipe, WeeklyMenu, PantryItem } from "../../types";
import { pantryApi } from "../../api";
import { T, COOKING_DAYS, formatQty, isPantryIngredient, mergeIngredients } from "../../lib/theme";
import { Btn } from "../../components/ui";

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  menu: WeeklyMenu | null;
  setMenu: React.Dispatch<React.SetStateAction<WeeklyMenu | null>>;
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

const STAPLE_KEYWORDS = ["oil","salt","pepper","sugar","flour","sauce","vinegar","powder","extract","seasoning","spice","herb","paste","stock","broth","garlic","onion","butter","milk"];

export function ShoppingPage({ recipes, menu, pantryItems, setPantryItems }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [extras, setExtras] = useState<string[]>([]);
  const [newExtra, setNewExtra] = useState("");

  const pantryNames = pantryItems.map((p) => p.name);
  const mealDays = COOKING_DAYS.filter((d) => menu?.days.find((md) => md.day === d && md.recipe));
  const order1Days = mealDays.filter((_, i) => i < Math.ceil(mealDays.length / 2));
  const order2Days = mealDays.filter((_, i) => i >= Math.ceil(mealDays.length / 2));

  const getList = (days: string[]) => {
    const recs = days
      .map((d) => menu?.days.find((md) => md.day === d)?.recipe)
      .filter((r): r is Recipe => !!r);
    return mergeIngredients(recs.map((r) => r.ingredients ?? []));
  };

  const o1List = getList(order1Days);
  const o2List = getList(order2Days);

  const allIngredients = mergeIngredients([...o1List, ...o2List].map((i) => [i]));
  const pantryAddSuggestions = allIngredients.filter((i) => {
    const n = i.name.toLowerCase();
    return STAPLE_KEYWORDS.some((k) => n.includes(k)) && !isPantryIngredient(i.name, pantryNames);
  });

  const handleAddToPantry = async (name: string) => {
    const { data } = await pantryApi.add(name);
    setPantryItems((p) => [...p, data]);
  };

  const addExtra = () => {
    if (newExtra.trim()) { setExtras((e) => [...e, newExtra.trim()]); setNewExtra(""); }
  };

  const OrderList = ({ label, days, list, orderId, accentColor }: {
    label: string; days: string[]; list: ReturnType<typeof getList>; orderId: string; accentColor: string;
  }) => {
    const needed = list.filter((i) => !isPantryIngredient(i.name, pantryNames));
    const pantryFlagged = list.filter((i) => isPantryIngredient(i.name, pantryNames));
    const meals = days.map((d) => menu?.days.find((md) => md.day === d)?.recipe).filter((r): r is Recipe => !!r);

    return (
      <div style={{ background: T.surface, border: `1px solid ${accentColor}44`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: `${accentColor}12`, borderBottom: `1px solid ${accentColor}33`, padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0, color: accentColor, fontFamily: "'Playfair Display',serif", fontSize: 18 }}>🛒 {label}</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: T.textMuted, fontFamily: "'DM Mono',monospace" }}>{days.length ? days.join(" · ") : "No days selected"}</p>
            </div>
            {meals.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {meals.map((r) => <span key={r.id} style={{ fontSize: 11, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 20, padding: "2px 8px", color: T.textMuted, fontFamily: "'DM Mono',monospace" }}>{r.title}</span>)}
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          {needed.length === 0 && pantryFlagged.length === 0
            ? <p style={{ color: T.textFaint, fontSize: 13, margin: 0 }}>Generate a menu first</p>
            : <>
              {needed.map((ing) => {
                const key = `${orderId}-${ing.name.toLowerCase()}`;
                const done = checked[key];
                return (
                  <div key={key} onClick={() => setChecked((p) => ({ ...p, [key]: !p[key] }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}`, cursor: "pointer", opacity: done ? .4 : 1, transition: "opacity .15s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${done ? accentColor : T.border}`, background: done ? accentColor : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                      {done && <span style={{ color: "#000", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ color: accentColor, fontFamily: "'DM Mono',monospace", fontSize: 13, minWidth: 64, flexShrink: 0, textDecoration: done ? "line-through" : "none" }}>{formatQty(ing.quantity)}{ing.unit ? " " + ing.unit : ""}</span>
                    <span style={{ color: T.text, fontSize: 15, flex: 1, textDecoration: done ? "line-through" : "none" }}>{ing.name}</span>
                  </div>
                );
              })}
              {pantryFlagged.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${T.border}` }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, color: T.textFaint, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>🧄 In pantry — check you have enough:</p>
                  {pantryFlagged.map((ing) => {
                    const key = `${orderId}-pantry-${ing.name.toLowerCase()}`;
                    const added = checked[key];
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: .5 }}>
                          <span style={{ color: T.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 12, minWidth: 64 }}>{formatQty(ing.quantity)}{ing.unit ? " " + ing.unit : ""}</span>
                          <span style={{ color: T.textMuted, fontSize: 14 }}>{ing.name}</span>
                        </div>
                        <button onClick={() => setChecked((p) => ({ ...p, [key]: !p[key] }))} style={{ background: "none", border: `1px solid ${added ? accentColor : T.border}`, color: added ? accentColor : T.textMuted, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
                          {added ? "✓ On list" : "+ Add to list"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          }
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: T.text }}>Shopping Lists</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textMuted }}>Auto-generated from your weekly menu</p>
        </div>
        <Btn variant="secondary" onClick={() => setChecked({})}>Clear all checks</Btn>
      </div>

      {pantryAddSuggestions.length > 0 && (
        <div style={{ background: `${T.accent}12`, border: `1px solid ${T.accent}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: T.accent, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>⚡ These look like pantry staples — add to skip from future lists?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {pantryAddSuggestions.slice(0, 10).map((ing) => (
              <button key={ing.name} onClick={() => handleAddToPantry(ing.name.toLowerCase())} style={{ background: T.bg, border: `1px solid ${T.accent}60`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: T.accent, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>+ {ing.name}</button>
            ))}
          </div>
        </div>
      )}

      <OrderList label="Order 1" days={order1Days} list={o1List} orderId="o1" accentColor={T.green} />
      <OrderList label="Order 2" days={order2Days} list={o2List} orderId="o2" accentColor={T.blue} />

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
        <h4 style={{ margin: "0 0 14px", color: T.textMuted, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Extra items</h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={newExtra} onChange={(e) => setNewExtra(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addExtra()} placeholder="Add anything else..." style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" }} onFocus={(e) => e.target.style.borderColor = T.accent} onBlur={(e) => e.target.style.borderColor = T.border} />
          <Btn onClick={addExtra}>Add</Btn>
        </div>
        {extras.length === 0
          ? <p style={{ color: T.textFaint, fontSize: 13, margin: 0 }}>Nothing added yet</p>
          : extras.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.text, fontSize: 14 }}>{it}</span>
              <button onClick={() => setExtras((e) => e.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}
