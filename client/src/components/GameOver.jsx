import React from "react";

export default function GameOver({ data, playerId, isHost, onRestart, onLobby }) {
  const isWinner = data.winnerId === playerId;
  const sortedPlayers = [...(data.players || [])].sort(
    (a, b) => (data.scores[b.id] || 0) - (data.scores[a.id] || 0)
  );

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.trophy}>{isWinner ? "🏆" : "💪"}</div>
        <h1 style={{ ...styles.title, color: isWinner ? "#F97316" : "#A78BFA" }}>
          {isWinner ? "You won!" : `${data.winnerName} wins!`}
        </h1>
        <p style={styles.sub}>
          {isWinner ? "Excellent vocabulary skills!" : "Better luck next time!"}
        </p>
      </div>

      <div style={styles.podium}>
        {sortedPlayers.map((p, i) => (
          <div key={p.id} style={{ ...styles.podiumRow, ...(i === 0 ? styles.podiumFirst : {}) }}>
            <span style={styles.rank}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
            <div style={styles.podiumAvatar}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <span style={styles.podiumName}>
              {p.name}{p.id === playerId ? " (you)" : ""}
            </span>
            <span style={styles.podiumScore}>{data.scores[p.id] || 0} pts</span>
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        {isHost && (
          <button style={styles.restartBtn} onClick={onRestart}>
            Play Again
          </button>
        )}
        <button style={styles.lobbyBtn} onClick={onLobby}>
          Back to Lobby
        </button>
        {!isHost && (
          <p style={styles.waitMsg}>Waiting for host to restart...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minHeight: "100dvh",
    padding: "40px 16px 32px",
    gap: "28px",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  hero: { textAlign: "center" },
  trophy: { fontSize: "4rem" },
  title: {
    fontSize: "2.5rem",
    fontWeight: 900,
    marginTop: "8px",
    letterSpacing: "-0.02em",
  },
  sub: { color: "#A78BFA", fontSize: "1rem", marginTop: "6px" },
  podium: {
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  podiumRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#1A1033",
    borderRadius: "14px",
    padding: "14px 16px",
    border: "1px solid rgba(124,58,237,0.2)",
  },
  podiumFirst: {
    background: "rgba(249,115,22,0.1)",
    border: "1px solid rgba(249,115,22,0.4)",
  },
  rank: { fontSize: "1.4rem", flexShrink: 0 },
  podiumAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED, #F97316)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1rem",
    flexShrink: 0,
  },
  podiumName: { flex: 1, fontWeight: 700, color: "#F5F3FF", fontSize: "1rem" },
  podiumScore: {
    fontWeight: 900,
    color: "#F97316",
    fontSize: "1.1rem",
    fontVariantNumeric: "tabular-nums",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "380px",
    alignItems: "center",
  },
  restartBtn: {
    width: "100%",
    padding: "18px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1.1rem",
    boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
  },
  lobbyBtn: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    background: "transparent",
    color: "#A78BFA",
    fontWeight: 700,
    fontSize: "1rem",
    border: "1.5px solid rgba(124,58,237,0.4)",
  },
  waitMsg: { color: "#A78BFA", fontSize: "0.85rem" },
};
