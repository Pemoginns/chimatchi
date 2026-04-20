import React, { useState, useRef, useEffect } from "react";
import { playWin, playLose, playChat } from "../sounds";

const REACTIONS = ["🎉", "🔥", "😭", "💪", "👏", "😂"];

export default function GameOver({ data, playerId, isHost, onRestart, onLobby, chatMessages, onSendChat, chatError }) {
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const prevChatLength = useRef(chatMessages.length);

  const isWinner = data.winnerId === playerId;

  useEffect(() => {
    if (isWinner) playWin();
    else playLose();
  }, []);

  useEffect(() => {
    if (chatMessages.length > prevChatLength.current) {
      const last = chatMessages[chatMessages.length - 1];
      if (last && last.playerId !== playerId) playChat();
    }
    prevChatLength.current = chatMessages.length;
  }, [chatMessages.length]);
  const sortedPlayers = [...(data.players || [])].sort(
    (a, b) => (data.scores[b.id] || 0) - (data.scores[a.id] || 0)
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendReaction = (emoji) => onSendChat(emoji);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    onSendChat(text);
    setChatInput("");
  };

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

      {/* Reactions + chat */}
      <div style={styles.chatCard}>
        <p style={styles.chatTitle}>Reactions</p>
        <div style={styles.reactionRow}>
          {REACTIONS.map(e => (
            <button key={e} style={styles.reactionBtn} onClick={() => sendReaction(e)}>{e}</button>
          ))}
        </div>
        <div style={styles.chatMessages}>
          {chatMessages.length === 0 && (
            <p style={styles.chatEmpty}>React to the game! 🎉</p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={styles.chatMsg}>
              <span style={{ ...styles.chatName, color: msg.playerId === playerId ? "#A78BFA" : "#F97316" }}>
                {msg.playerName}:
              </span>
              {" "}
              <span style={styles.chatText}>{msg.message}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {chatError && <p style={styles.chatError}>{chatError}</p>}
        <div style={styles.chatInputRow}>
          <input
            style={styles.chatInput}
            placeholder="Say something..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            maxLength={200}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>↑</button>
        </div>
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
    padding: "32px 16px 32px",
    gap: "20px",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  hero: { textAlign: "center" },
  trophy: { fontSize: "4rem" },
  title: { fontSize: "2.5rem", fontWeight: 900, marginTop: "8px", letterSpacing: "-0.02em" },
  sub: { color: "#A78BFA", fontSize: "1rem", marginTop: "6px" },
  podium: { width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "8px" },
  podiumRow: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#1A1033", borderRadius: "14px", padding: "14px 16px",
    border: "1px solid rgba(124,58,237,0.2)",
  },
  podiumFirst: { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.4)" },
  rank: { fontSize: "1.4rem", flexShrink: 0 },
  podiumAvatar: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED, #F97316)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "1rem", flexShrink: 0,
  },
  podiumName: { flex: 1, fontWeight: 700, color: "#F5F3FF", fontSize: "1rem" },
  podiumScore: { fontWeight: 900, color: "#F97316", fontSize: "1.1rem", fontVariantNumeric: "tabular-nums" },
  chatCard: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "16px",
    padding: "14px",
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  chatTitle: { fontWeight: 700, color: "#A78BFA", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 },
  reactionRow: { display: "flex", gap: "8px", justifyContent: "center" },
  reactionBtn: {
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "12px",
    fontSize: "1.5rem",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "transform 0.1s, background 0.15s",
    lineHeight: 1,
    flex: 1,
    maxWidth: "56px",
  },
  chatMessages: {
    maxHeight: "110px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minHeight: "32px",
  },
  chatEmpty: { color: "#4B3A6E", fontSize: "0.8rem", textAlign: "center", margin: "4px 0" },
  chatMsg: { fontSize: "0.85rem", lineHeight: 1.4, color: "#F5F3FF" },
  chatName: { fontWeight: 700, fontSize: "0.8rem" },
  chatText: { color: "#E2D9F3" },
  chatInputRow: { display: "flex", gap: "8px" },
  chatInput: {
    flex: 1,
    background: "#0F0A1E",
    border: "1.5px solid rgba(124,58,237,0.3)",
    borderRadius: "10px",
    color: "#F5F3FF",
    fontSize: "0.9rem",
    padding: "9px 12px",
  },
  sendBtn: {
    background: "#7C3AED",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 800,
    padding: "0 14px",
    cursor: "pointer",
  },
  chatError: {
    color: "#EF4444",
    fontSize: "0.78rem",
    background: "rgba(239,68,68,0.1)",
    borderRadius: "6px",
    padding: "5px 10px",
    margin: 0,
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
