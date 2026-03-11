import { type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { T } from "../../lib/theme";
import { useAuth } from "../../hooks/useAuth";

interface NavTab { id: string; label: string; icon: string; badge?: number | null; }

const TABS: NavTab[] = [
  { id: "recipes",  label: "Recipes",  icon: "📖" },
  { id: "rotation", label: "Rotation", icon: "⭐" },
  { id: "menu",     label: "Menu",     icon: "📅" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
  { id: "pantry",   label: "Pantry",   icon: "🧄" },
];

export function AppLayout({ children, rotationCount }: { children: ReactNode; rotationCount: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const currentTab = location.pathname.replace("/", "") || "recipes";

  const tabs = TABS.map((t) =>
    t.id === "rotation" ? { ...t, badge: rotationCount || null } : t
  );

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }
        @media (max-width:520px) { .nav-label { display:none !important; } .main-pad { padding:14px !important; } }
      `}</style>

      <header style={{ borderBottom: `1px solid ${T.border}`, padding: "0 14px", position: "sticky", top: 0, background: T.bg, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 6, height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>🍴</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: T.text, fontWeight: 700, whiteSpace: "nowrap" }}>Mise en Place</span>
          </div>

          <nav style={{ display: "flex", flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => navigate(`/${t.id}`)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0 10px", height: 54, flexShrink: 0,
                color: currentTab === t.id ? T.accent : T.textMuted,
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                borderBottom: currentTab === t.id ? `2px solid ${T.accent}` : "2px solid transparent",
                transition: "all .15s", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <span className="nav-label">{t.label}</span>
                {t.badge ? (
                  <span style={{ background: T.accent, color: "#000", borderRadius: 20, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
            <span style={{ color: T.textMuted, fontSize: 12, display: "none" }} className="nav-label">
              {user?.email}
            </span>
            <button onClick={logout} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "22px 18px" }}>
        {children}
      </main>
    </div>
  );
}
