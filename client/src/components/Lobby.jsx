import React, { useState } from "react";

export default function Lobby({ onCreate, onJoin, error, loading }) {
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState("create");
  const [difficulty, setDifficulty] = useState(1);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreate(playerName.trim(), difficulty);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    onJoin(joinCode.trim(), playerName.trim());
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>Pondre</h1>
        <p style={styles.subtitle}>Multiplayer vocabulary battle</p>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === "create" ? styles.tabActive : {}) }}
            onClick={() => setTab("create")}
          >
            Create Game
          </button>
          <button
            style={{ ...styles.tab, ...(tab === "join" ? styles.tabActive : {}) }}
            onClick={() => setTab("join")}
          >
            Join Game
          </button>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Your Name</label>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
            maxLength={20}
          />

          {tab === "join" && (
            <>
              <label style={styles.label}>Game Code</label>
              <input
                style={{ ...styles.input, textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "1.4rem", textAlign: "center" }}
                placeholder="XXXXXX"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                maxLength={6}
              />
            </>
          )}

          {tab === "create" && (
            <>
              <label style={styles.label}>Difficulty</label>
              <div style={styles.diffRow}>
                {[
                  { level: 1, label: "Easy", sub: "Common words" },
                  { level: 2, label: "Medium", sub: "Less common" },
                  { level: 3, label: "Hard", sub: "Rare words" },
                ].map(({ level, label, sub }) => (
                  <button
                    key={level}
                    style={{ ...styles.diffBtn, ...(difficulty === level ? styles.diffBtnActive : {}) }}
                    onClick={() => setDifficulty(level)}
                  >
                    <span style={styles.diffLabel}>{label}</span>
                    <span style={styles.diffSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          {tab === "create" ? (
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, ...(loading ? styles.btnLoading : {}) }}
              onClick={handleCreate}
              disabled={!playerName.trim() || loading}
            >
              {loading ? "Creating…" : "Create Game"}
            </button>
          ) : (
            <button
              style={{ ...styles.btn, ...styles.btnOrange, ...(loading ? styles.btnLoading : {}) }}
              onClick={handleJoin}
              disabled={!playerName.trim() || !joinCode.trim() || loading}
            >
              {loading ? "Joining…" : "Join Game"}
            </button>
          )}
        </div>
      </div>

      <div style={styles.langBadge}>
        <span style={styles.flag}>🇫🇷</span>
        <span style={styles.langText}>French ↔ English</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: "24px 16px",
    gap: "24px",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  hero: {
    textAlign: "center",
  },
  logo: {
    fontSize: "3.5rem",
    marginBottom: "8px",
  },
  title: {
    fontSize: "3rem",
    fontWeight: 900,
    background: "linear-gradient(135deg, #A78BFA, #F97316)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#A78BFA",
    fontSize: "1rem",
    marginTop: "4px",
  },
  card: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "20px",
    padding: "28px 24px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 0 40px rgba(124,58,237,0.15)",
  },
  tabs: {
    display: "flex",
    background: "#0F0A1E",
    borderRadius: "12px",
    padding: "4px",
    marginBottom: "24px",
    gap: "4px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    borderRadius: "9px",
    background: "transparent",
    color: "#A78BFA",
    fontWeight: 600,
    fontSize: "0.9rem",
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
    gap: "12px",
  },
  label: {
    fontSize: "0.8rem",
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
    padding: "14px 16px",
    width: "100%",
    transition: "border-color 0.2s",
  },
  error: {
    color: "#EF4444",
    fontSize: "0.85rem",
    textAlign: "center",
    background: "rgba(239,68,68,0.1)",
    borderRadius: "8px",
    padding: "8px 12px",
  },
  btn: {
    padding: "16px",
    borderRadius: "14px",
    fontWeight: 800,
    fontSize: "1.05rem",
    marginTop: "4px",
    transition: "all 0.15s",
    width: "100%",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
  },
  btnOrange: {
    background: "linear-gradient(135deg, #F97316, #EA580C)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
  },
  btnLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  diffRow: {
    display: "flex",
    gap: "8px",
  },
  diffBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    padding: "10px 6px",
    borderRadius: "12px",
    background: "#0F0A1E",
    border: "1.5px solid rgba(124,58,237,0.25)",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  diffBtnActive: {
    background: "rgba(124,58,237,0.2)",
    border: "1.5px solid #7C3AED",
  },
  diffLabel: {
    color: "#F5F3FF",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
  diffSub: {
    color: "#A78BFA",
    fontSize: "0.65rem",
    fontWeight: 600,
  },
  langBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: "20px",
    padding: "8px 16px",
  },
  flag: { fontSize: "1.2rem" },
  langText: { color: "#A78BFA", fontSize: "0.9rem", fontWeight: 600 },
};
