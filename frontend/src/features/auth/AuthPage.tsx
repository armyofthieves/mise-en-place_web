import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Inp, Btn } from "../../components/ui";
import { T } from "../../lib/theme";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      navigate("/recipes");
    } catch (e: any) {
      console.error("Auth error:", e);
      let msg = e.response?.data?.detail || e.response?.data?.non_field_errors?.[0];
      
      if (!msg && e.response) {
        // Fallback for other errors (like 404, 405, 500)
        msg = `Error ${e.response.status}: ${e.response.statusText}`;
        if (e.response.status === 405) {
          msg += " (Method Not Allowed - check API URL configuration)";
        } else if (e.response.status === 404) {
          msg += " (Not Found - check API URL configuration)";
        }
      } else if (!msg) {
         msg = e.message || "Something went wrong. Check your credentials.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 400, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍴</div>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display',serif", color: T.text, fontSize: 26 }}>Mise en Place</h1>
          <p style={{ margin: "6px 0 0", color: T.textMuted, fontSize: 14 }}>Your personal meal planner</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: 10, borderRadius: 8, cursor: "pointer",
              background: mode === m ? T.accent : T.bg,
              color: mode === m ? "#000" : T.textMuted,
              border: `1px solid ${mode === m ? T.accent : T.border}`,
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14,
            }}>{m === "login" ? "Sign In" : "Register"}</button>
          ))}
        </div>

        <Inp label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {mode === "register" && (
          <Inp label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your name" />
        )}
        <Inp label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="••••••••" />

        {error && <p style={{ color: T.red, fontSize: 13, margin: "0 0 14px" }}>{error}</p>}

        <Btn onClick={handleSubmit} disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
        </Btn>
      </div>
    </div>
  );
}
