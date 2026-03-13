import { useState, useEffect } from "react";
import type { Recipe, Rating } from "../types";
import { recipesApi } from "../api";
import { T, formatQty, isPantryIngredient, AVAILABLE_TAGS } from "../lib/theme";
import { Tag, Modal, RatingBadge, Btn, Inp, Txt } from "./ui";

interface Props {
  recipe: Recipe;
  onClose: () => void;
  onUpdate: (r: Recipe) => void;
  onDelete?: (id: number) => void;
  pantryNames: string[];
}

export function RecipeDetailModal({ recipe, onClose, onUpdate, onDelete, pantryNames }: Props) {
  const [servings, setServings] = useState(recipe.servings);
  const [reparsing, setReparsing] = useState(false);
  const [error, setError] = useState("");
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Recipe>(recipe);

  // Reset servings if recipe changes
  useEffect(() => {
    setServings(recipe.servings);
    setDraft(recipe);
  }, [recipe.id, recipe.servings]);

  const ratio = servings / (recipe.servings || 1);
  const scaled = (recipe.ingredients ?? []).map((i) => ({
    ...i,
    quantity: i.quantity != null ? Math.round(i.quantity * ratio * 100) / 100 : null
  }));

  const handleRate = async (rating: Rating) => {
    try {
      const { data } = await recipesApi.update(recipe.id, { rating });
      onUpdate(data);
    } catch (e) {
      console.error("Failed to rate recipe", e);
    }
  };

  const handleReparse = async () => {
    if (!recipe.source_url) return;
    if (!confirm("This will overwrite the current ingredients and steps with data fetched from the URL. Continue?")) return;
    
    setReparsing(true);
    setError("");
    try {
      const { data: parsed } = await recipesApi.parse({ url: recipe.source_url });
      // Update the recipe with new parsed data
      const { data: updated } = await recipesApi.update(recipe.id, {
        description: parsed.description,
        prep_time: parsed.prep_time,
        cook_time: parsed.cook_time,
        servings: parsed.servings,
        ingredients: parsed.ingredients,
        steps: parsed.steps,
        tags: parsed.tags,
        image_url: parsed.image_url
      });
      onUpdate(updated);
      setDraft(updated);
      alert("Recipe updated successfully!");
    } catch (e) {
      console.error(e);
      setError("Failed to reparse recipe. Please check the URL.");
    } finally {
      setReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) return;
    try {
      await recipesApi.delete(recipe.id);
      onDelete?.(recipe.id);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Failed to delete recipe.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Prepare payload - strip IDs from ingredients/steps to force recreation/update as simple lists
      const payload = {
        title: draft.title,
        description: draft.description,
        image_url: draft.image_url,
        servings: draft.servings,
        prep_time: draft.prep_time,
        cook_time: draft.cook_time,
        tags: draft.tags,
        ingredients: draft.ingredients.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
        steps: (draft.steps ?? []).map(s => ({ instruction: s.instruction })),
      };

      const { data } = await recipesApi.update(recipe.id, payload);
      onUpdate(data);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError("Failed to save changes.");
    }
  };

  const toggleTag = (t: string) => {
    setDraft(d => ({
      ...d,
      tags: d.tags.includes(t) ? d.tags.filter(x => x !== t) : [...d.tags, t]
    }));
  };

  if (isEditing) {
    return (
      <Modal title="Edit Recipe" onClose={() => setIsEditing(false)} wide>
        <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 10px", color: T.textMuted, fontSize: 11, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Details</h4>
            <Inp label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Inp label="Image URL" value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." />
            {draft.image_url && <img src={draft.image_url} alt="Preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, marginTop: 8 }} onError={(e) => e.currentTarget.style.display = "none"} />}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 10 }}>
                <Inp label="Servings" type="number" value={draft.servings} onChange={(e) => setDraft({ ...draft, servings: +e.target.value })} />
                <Inp label="Prep" value={draft.prep_time} onChange={(e) => setDraft({ ...draft, prep_time: e.target.value })} />
                <Inp label="Cook" value={draft.cook_time} onChange={(e) => setDraft({ ...draft, cook_time: e.target.value })} />
            </div>
        </div>

        <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AVAILABLE_TAGS.map((t) => <Tag key={t} label={t} active={draft.tags.includes(t)} onClick={() => toggleTag(t)} />)}
            </div>
        </div>

        <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 10px", color: T.textMuted, fontSize: 11, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Ingredients ({draft.ingredients.length})</h4>
            {draft.ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input value={ing.quantity ?? ""} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((x, j) => j === i ? { ...x, quantity: e.target.value ? +e.target.value : null } : x) })} style={{ width: 60, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: "'DM Mono',monospace" }} placeholder="qty" />
                <input value={ing.unit} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((x, j) => j === i ? { ...x, unit: e.target.value } : x) })} style={{ width: 80, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: "'DM Mono',monospace" }} placeholder="unit" />
                <input value={ing.name} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 13 }} />
                <button onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
              </div>
            ))}
            <Btn variant="secondary" onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, { name: "", quantity: null, unit: "" }] })} style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12, padding: "6px" }}>+ Add Ingredient</Btn>
        </div>

        <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 10px", color: T.textMuted, fontSize: 11, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Method ({(draft.steps ?? []).length})</h4>
            {(draft.steps ?? []).map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: T.textMuted, fontFamily: "'DM Mono',monospace", fontSize: 12, paddingTop: 8, minWidth: 20 }}>{i + 1}.</span>
                <textarea 
                  value={step.instruction} 
                  onChange={(e) => setDraft({ ...draft, steps: (draft.steps ?? []).map((x, j) => j === i ? { ...x, instruction: e.target.value } : x) })}
                  style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px", color: T.text, fontSize: 13, fontFamily: "'DM Sans',sans-serif", minHeight: 60, resize: "vertical" }} 
                  placeholder="Step instruction..."
                />
                <button onClick={() => setDraft({ ...draft, steps: (draft.steps ?? []).filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 16, padding: "4px", alignSelf: "center" }}>✕</button>
              </div>
            ))}
            <Btn variant="secondary" onClick={() => setDraft({ ...draft, steps: [...(draft.steps ?? []), { instruction: "" }] })} style={{ width: "100%", justifyContent: "center", marginTop: 8, fontSize: 12, padding: "6px" }}>+ Add Step</Btn>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setIsEditing(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
          <Btn onClick={handleSaveEdit} style={{ flex: 2, justifyContent: "center" }}>Save Changes</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={recipe.title} onClose={onClose} wide>
      {recipe.image_url && (
        <div style={{ margin: "-20px -24px 20px", height: 200, overflow: "hidden", position: "relative" }}>
             <img src={recipe.image_url} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => e.currentTarget.style.display = "none"} />
             <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1a1a1a 0%, transparent 100%)" }} />
        </div>
      )}
      
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {recipe.prep_time && <span style={{ color: T.textMuted, fontSize: 13 }}>⏱ Prep: {recipe.prep_time}</span>}
        {recipe.cook_time && <span style={{ color: T.textMuted, fontSize: 13 }}>🍳 Cook: {recipe.cook_time}</span>}
        
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => setIsEditing(true)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
                ✎ Edit
            </button>
            {recipe.source_url && (
             <button onClick={handleReparse} disabled={reparsing} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
                {reparsing ? "Updating..." : "↻ Reparse"}
             </button>
            )}
            {recipe.source_url && (
             <a href={recipe.source_url} target="_blank" rel="noreferrer" style={{ color: T.accent, fontSize: 13, textDecoration: "none" }}>
               View original ↗
             </a>
            )}
        </div>
      </div>
      
      {error && <div style={{ background: "#3d1a1a", color: "#ff8080", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {recipe.tags?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {recipe.tags.map((t) => <Tag key={t} label={t} />)}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ color: T.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>SERVINGS</span>
        <button onClick={() => setServings((s) => Math.max(1, s - 1))} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>−</button>
        <span style={{ color: T.text, fontWeight: 700, fontSize: 18, minWidth: 20, textAlign: "center" }}>{servings}</span>
        <button onClick={() => setServings((s) => s + 1)} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>+</button>
        
        <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>RATING:</span>
            <RatingBadge rating={recipe.rating} onChange={handleRate} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
        <div>
          <h4 style={{ margin: "0 0 12px", color: T.accent, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Ingredients</h4>
          {scaled.map((ing, i) => {
            const ip = isPantryIngredient(ing.name, pantryNames);
            const hasQty = ing.quantity != null || !!ing.unit;
            return (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, opacity: ip ? 0.6 : 1, alignItems: "center" }}>
                {hasQty && (
                  <span style={{ color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 12, minWidth: 52, flexShrink: 0 }}>
                    {formatQty(ing.quantity)}{ing.unit ? " " + ing.unit : ""}
                  </span>
                )}
                <span style={{ color: T.text, fontSize: 14 }}>{ing.name}</span>
                {ip && (
                    <span style={{ fontSize: 9, color: T.textMuted, border: `1px solid ${T.border}`, borderRadius: 4, padding: "0 4px", height: 16, display: "flex", alignItems: "center", textTransform: "uppercase" }}>Pantry</span>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <h4 style={{ margin: "0 0 12px", color: T.accent, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Method</h4>
          {(recipe.steps ?? []).length === 0 ? (
             <p style={{ color: T.textMuted, fontSize: 14, fontStyle: "italic" }}>No instructions available.</p>
          ) : (
            (recipe.steps ?? []).map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <span style={{ color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, minWidth: 20, paddingTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.7 }}>{step.instruction}</p>
                </div>
            ))
          )}
        </div>
      </div>
      
      {onDelete && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleDelete} style={{ background: "none", border: `1px solid ${T.red}66`, color: T.red, borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Delete Recipe
            </button>
        </div>
      )}
    </Modal>
  );
}
