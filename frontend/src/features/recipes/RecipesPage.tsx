import { useState } from "react";
import type { Recipe, ParsedRecipe, Rating } from "../../types";
import { recipesApi } from "../../api";
import { T, AVAILABLE_TAGS, RATING_LABELS, RATING_COLORS, formatQty, isPantryIngredient } from "../../lib/theme";
import { Tag, Btn, Inp, Txt, Modal, RatingBadge } from "../../components/ui";
import type { PantryItem } from "../../types";

interface Props {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  pantryItems: PantryItem[];
}

// ─── Add Recipe Modal ─────────────────────────────────────────────────────────
function AddRecipeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Recipe) => void }) {
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [manual, setManual] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [selTags, setSelTags] = useState<string[]>([]);

  const handleParse = async () => {
    setLoading(true); setError("");
    try {
      const payload = mode === "url" ? { url } : { text: manual };
      const { data } = await recipesApi.parse(payload);
      setParsed(data);
      setSelTags(data.tags ?? []);
    } catch { setError("Couldn't parse. Try pasting the recipe text manually."); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!parsed) return;
    try {
      const { data } = await recipesApi.create({
        ...parsed,
        tags: selTags,
        source_url: mode === "url" ? url : null,
        rating: null,
        in_rotation: false,
        description: parsed.description ?? "",
      });
      onAdd(data);
      onClose();
    } catch { setError("Failed to save recipe."); }
  };

  const toggleTag = (t: string) =>
    setSelTags((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]);

  return (
    <Modal title="Add Recipe" onClose={onClose} wide>
      {!parsed ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {(["url", "manual"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: 10, borderRadius: 8, cursor: "pointer",
                background: mode === m ? T.accent : T.bg, color: mode === m ? "#000" : T.textMuted,
                border: `1px solid ${mode === m ? T.accent : T.border}`,
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
              }}>{m === "url" ? "🔗 Paste URL" : "✏️ Manual Entry"}</button>
            ))}
          </div>
          {mode === "url"
            ? <Inp label="Recipe URL" placeholder="https://www.allrecipes.com/recipe/..." value={url} onChange={(e) => setUrl(e.target.value)} />
            : <Txt label="Paste recipe text" placeholder="Paste the full recipe — AI will clean it up." value={manual} onChange={(e) => setManual(e.target.value)} style={{ minHeight: 200 }} />
          }
          {error && <p style={{ color: T.red, fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
          <Btn onClick={handleParse} disabled={loading || (mode === "url" ? !url : !manual)} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "⏳ Parsing..." : "✨ Parse with AI"}
          </Btn>
        </>
      ) : (
        <>
          <Inp label="Title" value={parsed.title} onChange={(e) => setParsed((p) => p ? { ...p, title: e.target.value } : p)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <Inp label="Servings" type="number" value={parsed.servings} onChange={(e) => setParsed((p) => p ? { ...p, servings: +e.target.value } : p)} />
            <Inp label="Prep" value={parsed.prep_time} onChange={(e) => setParsed((p) => p ? { ...p, prep_time: e.target.value } : p)} />
            <Inp label="Cook" value={parsed.cook_time} onChange={(e) => setParsed((p) => p ? { ...p, cook_time: e.target.value } : p)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Tags</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {AVAILABLE_TAGS.map((t) => <Tag key={t} label={t} active={selTags.includes(t)} onClick={() => toggleTag(t)} />)}
            </div>
          </div>
          <div style={{ background: T.bg, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <h4 style={{ margin: "0 0 10px", color: T.textMuted, fontSize: 11, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>Ingredients ({parsed.ingredients?.length})</h4>
            {parsed.ingredients?.map((ing, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input value={ing.quantity ?? ""} onChange={(e) => setParsed((p) => p ? { ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, quantity: e.target.value ? +e.target.value : null } : x) } : p)} style={{ width: 52, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: "'DM Mono',monospace" }} placeholder="qty" />
                <input value={ing.unit} onChange={(e) => setParsed((p) => p ? { ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, unit: e.target.value } : x) } : p)} style={{ width: 70, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: "'DM Mono',monospace" }} placeholder="unit" />
                <input value={ing.name} onChange={(e) => setParsed((p) => p ? { ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x) } : p)} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 8px", color: T.text, fontSize: 13 }} />
                <button onClick={() => setParsed((p) => p ? { ...p, ingredients: p.ingredients.filter((_, j) => j !== i) } : p)} style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={() => setParsed(null)} style={{ flex: 1, justifyContent: "center" }}>← Back</Btn>
            <Btn onClick={handleSave} style={{ flex: 2, justifyContent: "center" }}>Save Recipe</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Recipe Detail Modal ──────────────────────────────────────────────────────
function RecipeDetailModal({ recipe, onClose, onUpdate, pantryNames }: { recipe: Recipe; onClose: () => void; onUpdate: (r: Recipe) => void; pantryNames: string[] }) {
  const [servings, setServings] = useState(recipe.servings);
  const ratio = servings / (recipe.servings || 1);
  const scaled = (recipe.ingredients ?? []).map((i) => ({ ...i, quantity: i.quantity != null ? Math.round(i.quantity * ratio * 100) / 100 : null }));

  const handleRate = async (rating: Rating) => {
    const { data } = await recipesApi.update(recipe.id, { rating });
    onUpdate(data);
  };

  return (
    <Modal title={recipe.title} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {recipe.prep_time && <span style={{ color: T.textMuted, fontSize: 13 }}>⏱ Prep: {recipe.prep_time}</span>}
        {recipe.cook_time && <span style={{ color: T.textMuted, fontSize: 13 }}>🍳 Cook: {recipe.cook_time}</span>}
        {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noreferrer" style={{ color: T.accent, fontSize: 13, marginLeft: "auto", textDecoration: "none" }}>View original ↗</a>}
      </div>
      {recipe.tags?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{recipe.tags.map((t) => <Tag key={t} label={t} />)}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ color: T.textMuted, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>SERVINGS</span>
        <button onClick={() => setServings((s) => Math.max(1, s - 1))} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>−</button>
        <span style={{ color: T.text, fontWeight: 700, fontSize: 18, minWidth: 20, textAlign: "center" }}>{servings}</span>
        <button onClick={() => setServings((s) => s + 1)} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>+</button>
        <RatingBadge rating={recipe.rating} onChange={handleRate} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
        <div>
          <h4 style={{ margin: "0 0 12px", color: T.accent, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Ingredients</h4>
          {scaled.map((ing, i) => {
            const ip = isPantryIngredient(ing.name, pantryNames);
            return (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, opacity: ip ? .4 : 1, textDecoration: ip ? "line-through" : "none" }}>
                <span style={{ color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 12, minWidth: 52, flexShrink: 0 }}>{formatQty(ing.quantity)}{ing.unit ? " " + ing.unit : ""}</span>
                <span style={{ color: T.text, fontSize: 14 }}>{ing.name}</span>
              </div>
            );
          })}
        </div>
        <div>
          <h4 style={{ margin: "0 0 12px", color: T.accent, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>Method</h4>
          {(recipe.steps ?? []).map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <span style={{ color: T.accent, fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, minWidth: 20, paddingTop: 2, flexShrink: 0 }}>{i + 1}.</span>
              <p style={{ margin: 0, color: T.text, fontSize: 14, lineHeight: 1.7 }}>{step.instruction}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe, inRotation, onToggleRotation, onRate, onClick }: {
  recipe: Recipe; inRotation: boolean;
  onToggleRotation: () => void; onRate: (r: Rating) => void; onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, cursor: "pointer", transition: "all .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ margin: "0 0 6px", fontFamily: "'Playfair Display',serif", color: T.text, fontSize: 16, lineHeight: 1.3, flex: 1, paddingRight: 4 }}>{recipe.title}</h3>
        <button onClick={(e) => { e.stopPropagation(); onToggleRotation(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: inRotation ? T.accent : T.textFaint, transition: "all .2s", padding: "2px 4px", lineHeight: 1, flexShrink: 0 }}>★</button>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        {recipe.prep_time && <span style={{ color: T.textMuted, fontSize: 12 }}>⏱ {recipe.prep_time}</span>}
        {recipe.cook_time && <span style={{ color: T.textMuted, fontSize: 12 }}>🍳 {recipe.cook_time}</span>}
        <span style={{ color: T.textMuted, fontSize: 12 }}>👥 {recipe.servings}</span>
      </div>
      {recipe.tags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>{recipe.tags.slice(0, 3).map((t) => <Tag key={t} label={t} />)}{recipe.tags.length > 3 && <Tag label={`+${recipe.tags.length - 3}`} />}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        {recipe.rating ? <RatingBadge rating={recipe.rating} onChange={onRate} /> : <span style={{ fontSize: 12, color: T.textFaint }}>Not rated</span>}
        {inRotation && <span style={{ color: T.accent, fontSize: 11, fontFamily: "'DM Mono',monospace" }}>★ ROTATION</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function RecipesPage({ recipes, setRecipes, pantryItems }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<Recipe | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<string | null>(null);

  const pantryNames = pantryItems.map((p) => p.name);

  const filtered = recipes.filter((r) => {
    const ms = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const mt = !filterTag || r.tags?.includes(filterTag);
    const mr = !filterRating || r.rating === filterRating;
    return ms && mt && mr;
  });

  const usedTags = [...new Set(recipes.flatMap((r) => r.tags ?? []))];

  const handleAdd = (r: Recipe) => setRecipes((p) => [r, ...p]);

  const handleUpdate = (r: Recipe) => setRecipes((p) => p.map((x) => x.id === r.id ? r : x));

  const handleToggleRotation = async (recipe: Recipe) => {
    const { data } = await recipesApi.update(recipe.id, { in_rotation: !recipe.in_rotation });
    setRecipes((p) => p.map((x) => x.id === data.id ? data : x));
  };

  const handleRate = async (recipe: Recipe, rating: Rating) => {
    const { data } = await recipesApi.update(recipe.id, { rating });
    setRecipes((p) => p.map((x) => x.id === data.id ? data : x));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 140, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
        <Btn onClick={() => setShowAdd(true)}>+ Add Recipe</Btn>
      </div>

      {usedTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Tag label="All" active={!filterTag && !filterRating} onClick={() => { setFilterTag(null); setFilterRating(null); }} />
          {usedTags.map((t) => <Tag key={t} label={t} active={filterTag === t} onClick={() => setFilterTag(filterTag === t ? null : t)} />)}
          {(["loved", "okay", "skip"] as Rating[]).map((r) => <Tag key={r} label={RATING_LABELS[r]} active={filterRating === r} onClick={() => setFilterRating(filterRating === r ? null : r)} />)}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: T.textMuted }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍽</div>
          <p style={{ fontSize: 18, fontFamily: "'Playfair Display',serif", color: T.text, marginBottom: 6 }}>{recipes.length === 0 ? "No recipes yet" : "No matches"}</p>
          <p style={{ fontSize: 14, margin: "0 0 16px" }}>{recipes.length === 0 ? "Add your first recipe to get started" : "Try adjusting filters"}</p>
          {recipes.length === 0 && <Btn onClick={() => setShowAdd(true)}>+ Add First Recipe</Btn>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} inRotation={r.in_rotation}
              onToggleRotation={() => handleToggleRotation(r)}
              onRate={(rating) => handleRate(r, rating)}
              onClick={() => setDetail(r)} />
          ))}
        </div>
      )}

      {showAdd && <AddRecipeModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {detail && <RecipeDetailModal recipe={detail} onClose={() => setDetail(null)} onUpdate={(r) => { handleUpdate(r); setDetail(r); }} pantryNames={pantryNames} />}
    </div>
  );
}
