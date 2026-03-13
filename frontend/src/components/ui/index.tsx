import { type ReactNode, type CSSProperties, type InputHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { T, RATING_LABELS, RATING_COLORS } from "../../lib/theme";
import type { Rating } from "../../types";

// ─── Tag ──────────────────────────────────────────────────────────────────────
interface TagProps {
  label: string;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}
export function Tag({ label, active, onRemove, onClick }: TagProps) {
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Mono',monospace",
      background: active ? T.accent : T.tag, color: active ? "#000" : T.textMuted,
      border: `1px solid ${active ? T.accent : T.border}`,
      cursor: onClick || onRemove ? "pointer" : "default",
      userSelect: "none", transition: "all .15s",
    }}>
      {label}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ opacity: .6, marginLeft: 2, fontSize: 10, cursor: "pointer" }}>✕</span>
      )}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "green";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  children: ReactNode;
}
export function Btn({ children, variant = "primary", style, ...p }: BtnProps) {
  const variants: Record<BtnVariant, CSSProperties> = {
    primary:   { background: T.accent, color: "#000", border: "none" },
    secondary: { background: "transparent", color: T.text, border: `1px solid ${T.border}` },
    danger:    { background: "transparent", color: T.red, border: `1px solid ${T.red}` },
    ghost:     { background: "transparent", color: T.textMuted, border: "none" },
    green:     { background: "transparent", color: T.green, border: `1px solid ${T.green}` },
  };
  return (
    <button {...p} style={{
      padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14,
      fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: "all .15s",
      display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InpProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; }
export function Inp({ label, style, ...p }: InpProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>}
      <input {...p} style={{
        width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
        outline: "none", boxSizing: "border-box", ...style,
      }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; p.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = T.border; p.onBlur?.(e); }} />
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TxtProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function Txt({ label, style, ...p }: TxtProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: T.textMuted, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>}
      <textarea {...p} style={{
        width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
        outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 120, ...style,
      }}
        onFocus={(e) => { e.target.style.borderColor = T.accent; p.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = T.border; p.onBlur?.(e); }} />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { title: string; onClose: () => void; children: ReactNode; wide?: boolean; }
export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.82)", zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "16px 12px", overflowY: "auto",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
        width: "100%", maxWidth: wide ? 820 : 560, marginTop: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.surface, zIndex: 2, borderRadius: "16px 16px 0 0" }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: T.text, fontSize: 20 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>✕</button>
        </div>
        <div style={{ padding: 20, maxHeight: "80vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Rating Badge ─────────────────────────────────────────────────────────────
interface RatingBadgeProps { rating: Rating | null; onChange: (r: Rating) => void; }
export function RatingBadge({ rating, onChange }: RatingBadgeProps) {
  return (
    <div style={{ display: "flex", gap: 4, background: T.surface, padding: 2, borderRadius: 20, border: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
      {(Object.entries(RATING_LABELS) as [Rating, string][]).map(([k, v]) => {
        const isSel = rating === k;
        return (
          <button
            key={k}
            onClick={() => onChange(k)}
            title={v}
            style={{
              background: isSel ? RATING_COLORS[k] : "transparent",
              color: isSel ? "#fff" : T.textMuted,
              border: "none",
              borderRadius: 16,
              padding: "4px 8px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "'DM Mono',monospace",
              transition: "all .15s",
              opacity: isSel ? 1 : 0.6,
              minWidth: isSel ? "auto" : 24,
              textAlign: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = isSel ? "1" : "0.6"}
          >
            {isSel ? v : v[0]}
          </button>
        );
      })}
    </div>
  );
}
