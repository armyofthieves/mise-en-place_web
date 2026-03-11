import { useState } from "react";
import type { PantryItem, Recipe, WeeklyMenu } from "../../types";
import { pantryApi } from "../../api";
import { T } from "../../lib/theme";
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {pantryItems.map((item) => <Tag key={item.id} label={item.name} onRemove={() => remove(item)} />)}
      </div>
    </div>
  );
}
