import { useState, useMemo } from "react";
import type { PantryItem, Recipe, WeeklyMenu } from "../../types";
import { pantryApi } from "../../api";
import { T, getPantryCategory, PANTRY_CATEGORIES } from "../../lib/theme";
import { Tag, Btn } from "../../components/ui";

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  menu: WeeklyMenu | null;
  setMenu: React.Dispatch<React.SetStateAction<WeeklyMenu | null>>;
  pantryItems: PantryItem[];
  setPantryItems: React.Dispatch<React.SetStateAction<PantryItem[]>>;
}

export function PantryPage({ pantryItems, setPantryItems }: Props) {
  const [newItem, setNewItem] = useState("");

  const add = async () => {
    const name = newItem.trim().toLowerCase();
    if (!name || pantryItems.some((p) => p.name === name)) return;
    const { data } = await pantryApi.add(name);
    setPantryItems((p) => [...p, data]);
    setNewItem("");
  };

  const remove = async (item: PantryItem) => {
    await pantryApi.remove(item.id);
    setPantryItems((p) => p.filter((x) => x.id !== item.id));
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, PantryItem[]> = {};
    const categories = [...Object.keys(PANTRY_CATEGORIES), "Miscellaneous"];
    
    categories.forEach(cat => { groups[cat] = []; });
    
    pantryItems.forEach(item => {
      const cat = getPantryCategory(item.name);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    
    return groups;
  }, [pantryItems]);

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ color: T.textMuted, marginBottom: 18, fontSize: 14 }}>
        Pantry items are excluded from shopping lists. You can also add items directly from the Shopping List tab.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add staple (e.g. olive oil)"
          style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" }}
          onFocus={(e) => e.target.style.borderColor = T.accent}
          onBlur={(e) => e.target.style.borderColor = T.border} />
        <Btn onClick={add}>Add</Btn>
      </div>
      
      {Object.entries(groupedItems).map(([category, items]) => {
        if (items.length === 0) return null;
        return (
          <div key={category} style={{ marginBottom: 20 }}>
            <h4 style={{ color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>{category}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map((item) => <Tag key={item.id} label={item.name} onRemove={() => remove(item)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
