import React, { useEffect, useState } from "react";

const DIFF_LABEL = ["", "Easy", "Medium", "Hard"];
const DIFF_COLOR = ["", "#22C55E", "#F97316", "#EF4444"];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminPage({ onBack }) {
  const [games, setGames] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/games")
      .then(r => r.json())
      .then(data => setGames([...data].reverse()))
      .catch(() => setError("Failed to load data"));
  }, []);

  const totalGames = games?.length ?? 0;
  const winCounts = {};
  games?.forEach(g => {
    if (g.winner && g.winner !== "No one") winCounts[g.winner] = (winCounts[g.winner] || 0) + 1;
  });
  const topPlayer = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 style={styles.title}>Game Analytics</h1>
        <div style={styles.headerRight} />
      </div>

      {games && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{totalGames}</span>
            <span style={styles.statLabel}>Games Played</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{topPlayer ? topPlayer[0] : "—"}</span>
            <span style={styles.statLabel}>Top Player</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{topPlayer ? topPlayer[1] : "—"}</span>
            <span style={styles.statLabel}>Most Wins</span>
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {games === null && !error && (
        <p style={styles.loading}>Loading…</p>
      )}

      {games && games.length === 0 && (
        <p style={styles.empty}>No games recorded yet.</p>
      )}

      {games && games.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Date & Time", "Room", "Difficulty", "Players & Scores", "Winner", "Rounds"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {games.map((g, i) => (
                <tr key={g.gameId + i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{totalGames - i}</td>
                  <td style={styles.td}>{formatDate(g.timestamp)}</td>
                  <td style={{ ...styles.td, ...styles.monospace }}>{g.gameId}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.diffBadge, color: DIFF_COLOR[g.difficulty], borderColor: DIFF_COLOR[g.difficulty] + "55", background: DIFF_COLOR[g.difficulty] + "15" }}>
                      {DIFF_LABEL[g.difficulty] || "Easy"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {g.players.map(p => (
                      <span key={p.name} style={styles.playerChip}>
                        {p.name} <strong>{p.score}</strong>
                      </span>
                    ))}
                  </td>
                  <td style={{ ...styles.td, color: "#F97316", fontWeight: 700 }}>{g.winner}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>{g.roundsPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
    padding: "24px 16px 48px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: "1100px",
    width: "100%",
    alignSelf: "center",
  },
  backBtn: {
    background: "transparent",
    border: "1.5px solid rgba(124,58,237,0.4)",
    borderRadius: "10px",
    color: "#A78BFA",
    padding: "8px 16px",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  title: {
    color: "#F5F3FF",
    fontWeight: 900,
    fontSize: "1.6rem",
    letterSpacing: "-0.02em",
  },
  headerRight: { width: "80px" },
  statsRow: {
    display: "flex",
    gap: "12px",
    maxWidth: "1100px",
    width: "100%",
    alignSelf: "center",
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "120px",
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "14px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statVal: {
    color: "#F5F3FF",
    fontWeight: 900,
    fontSize: "1.6rem",
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statLabel: {
    color: "#A78BFA",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  loading: { color: "#A78BFA", textAlign: "center", padding: "48px" },
  empty: { color: "#A78BFA", textAlign: "center", padding: "48px" },
  error: { color: "#EF4444", textAlign: "center", padding: "24px" },
  tableWrap: {
    overflowX: "auto",
    maxWidth: "1100px",
    width: "100%",
    alignSelf: "center",
    borderRadius: "16px",
    border: "1px solid rgba(124,58,237,0.25)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
    color: "#F5F3FF",
  },
  th: {
    background: "#1A1033",
    color: "#A78BFA",
    fontWeight: 700,
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "1px solid rgba(124,58,237,0.25)",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 16px",
    verticalAlign: "middle",
    color: "#E0D9FF",
    fontSize: "0.88rem",
  },
  rowEven: { background: "rgba(26,16,51,0.6)" },
  rowOdd: { background: "rgba(15,10,30,0.6)" },
  monospace: {
    fontFamily: "monospace",
    letterSpacing: "0.1em",
    color: "#A78BFA",
    fontSize: "0.95rem",
  },
  diffBadge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  playerChip: {
    display: "inline-block",
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "20px",
    padding: "2px 10px",
    marginRight: "6px",
    marginBottom: "2px",
    fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
};
