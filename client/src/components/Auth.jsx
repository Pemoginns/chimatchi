import React, { useState } from "react";

export default function Auth({ onSuccess, onClose }) {
  const [tab, setTab] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${tab === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      localStorage.setItem("pondre_auth", JSON.stringify({ token: data.token, user: data.user }));
      onSuccess(data.user, data.token);
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={styles.title}>
          {tab === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p style={styles.sub}>
          {tab === "login" ? "Sign in to track your wins" : "Start tracking your wins"}
        </p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "login" ? styles.tabActive : {}) }}
            onClick={() => { setTab("login"); setError(null); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "register" ? styles.tabActive : {}) }}
            onClick={() => { setTab("register"); setError(null); }}
          >
            Create Account
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            placeholder="Your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            autoComplete="username"
          />
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKey}
            maxLength={64}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{ ...styles.btn, ...(loading ? styles.btnLoading : {}) }}
            onClick={submit}
            disabled={!username.trim() || !password.trim() || loading}
          >
            {loading ? "…" : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  modal: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "24px",
    padding: "32px 28px",
    width: "100%",
    maxWidth: "380px",
    position: "relative",
    boxShadow: "0 0 60px rgba(124,58,237,0.3)",
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "transparent",
    border: "none",
    color: "#A78BFA",
    fontSize: "1.1rem",
    cursor: "pointer",
    lineHeight: 1,
    padding: "4px",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#F5F3FF",
    marginBottom: "4px",
  },
  sub: {
    color: "#A78BFA",
    fontSize: "0.9rem",
    marginBottom: "20px",
  },
  tabs: {
    display: "flex",
    background: "#0F0A1E",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "20px",
    gap: "4px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    borderRadius: "9px",
    background: "transparent",
    color: "#A78BFA",
    fontWeight: 600,
    fontSize: "0.85rem",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#7C3AED",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(124,58,237,0.4)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#A78BFA",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  input: {
    background: "#0F0A1E",
    border: "1.5px solid rgba(124,58,237,0.4)",
    borderRadius: "12px",
    color: "#F5F3FF",
    fontSize: "1rem",
    padding: "13px 16px",
    width: "100%",
  },
  error: {
    color: "#EF4444",
    fontSize: "0.85rem",
    background: "rgba(239,68,68,0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
    textAlign: "center",
  },
  btn: {
    padding: "15px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1rem",
    marginTop: "4px",
    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
    transition: "all 0.15s",
    width: "100%",
  },
  btnLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
};
