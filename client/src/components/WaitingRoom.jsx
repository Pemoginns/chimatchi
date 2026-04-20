import React, { useState, useRef, useEffect } from "react";

const LANG_META = {
  french:  { flag: "🇫🇷", name: "French" },
  irish:   { flag: "🇮🇪", name: "Irish" },
  spanish: { flag: "🇪🇸", name: "Spanish" },
};

const QUICK_EMOTES = ["👋", "🔥", "😄", "💪", "😂", "🤔"];

export default function WaitingRoom({ room, playerId, onStart, onCancel, error, chatMessages, onSendChat }) {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const isHost = room.host === playerId;
  const lang = LANG_META[room.language] || LANG_META.french;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    onSendChat(text);
    setChatInput("");
  };

  const sendEmote = (emoji) => onSendChat(emoji);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Waiting Room</h2>
        <p style={styles.sub}>{isHost ? "Share the code below" : "Waiting for host to start..."}</p>
        <div style={styles.badges}>
          <div style={styles.diffBadge}>
            {["", "Easy", "Medium", "Hard"][room.difficulty || 1]}
          </div>
          <div style={styles.langBadge}>
            {lang.flag} {lang.name}
          </div>
        </div>
      </div>

      <div style={styles.codeCard} onClick={copyCode}>
        <p style={styles.codeLabel}>Game Code</p>
        <p style={styles.code}>{room.roomId}</p>
        <p style={styles.copyHint}>{copied ? "Copied!" : "Tap to copy"}</p>
      </div>

      <div style={styles.playersCard}>
        <div style={styles.playersHeader}>
          <span style={styles.playersTitle}>Players</span>
          <span style={styles.playerCount}>{room.players.length}</span>
        </div>
        <div style={styles.playerList}>
          {room.players.map((p) => (
            <div key={p.id} style={styles.playerRow}>
              <div style={styles.avatar}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span style={styles.playerName}>{p.name}</span>
              {p.id === room.host && <span style={styles.hostBadge}>HOST</span>}
              {p.id === playerId && <span style={styles.youBadge}>YOU</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div style={styles.chatCard}>
        <p style={styles.chatTitle}>Chat</p>
        <div style={styles.chatMessages}>
          {chatMessages.length === 0 && (
            <p style={styles.chatEmpty}>Say hi! 👋</p>
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
        <div style={styles.emoteRow}>
          {QUICK_EMOTES.map(e => (
            <button key={e} style={styles.emoteBtn} onClick={() => sendEmote(e)}>{e}</button>
          ))}
        </div>
        <div style={styles.chatInputRow}>
          <input
            style={styles.chatInput}
            placeholder="Type a message..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            maxLength={200}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>↑</button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {isHost && (
        <div style={styles.hostButtons}>
          <button
            style={{
              ...styles.startBtn,
              ...(room.players.length < 2 ? styles.startBtnDisabled : {}),
            }}
            onClick={onStart}
            disabled={room.players.length < 2}
          >
            {room.players.length < 2 ? "Waiting for players..." : "Start Game"}
          </button>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancel Game
          </button>
        </div>
      )}

      <div style={styles.rules}>
        <p>🏆 First to <strong>5 points</strong> wins</p>
        <p>⚡ Fastest correct answer gets the point</p>
        <p>{lang.flag} {lang.name} ↔ English</p>
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
    padding: "32px 16px 24px",
    gap: "16px",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  header: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  title: { fontSize: "1.8rem", fontWeight: 900, color: "#F5F3FF" },
  sub: { color: "#A78BFA", fontSize: "0.9rem" },
  badges: { display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" },
  diffBadge: {
    background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "20px",
    padding: "3px 14px",
    color: "#A78BFA",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  langBadge: {
    background: "rgba(249,115,22,0.15)",
    border: "1px solid rgba(249,115,22,0.3)",
    borderRadius: "20px",
    padding: "3px 14px",
    color: "#F97316",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
  },
  codeCard: {
    background: "linear-gradient(135deg, #7C3AED20, #F9731620)",
    border: "2px solid rgba(124,58,237,0.5)",
    borderRadius: "20px",
    padding: "20px 40px",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.1s",
    width: "100%",
    maxWidth: "360px",
    userSelect: "none",
  },
  codeLabel: { color: "#A78BFA", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" },
  code: { fontSize: "3rem", fontWeight: 900, letterSpacing: "0.15em", color: "#F5F3FF", fontVariantNumeric: "tabular-nums" },
  copyHint: { color: "#A78BFA", fontSize: "0.75rem", marginTop: "4px" },
  playersCard: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "16px",
    padding: "16px",
    width: "100%",
    maxWidth: "360px",
  },
  playersHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  playersTitle: { fontWeight: 700, color: "#A78BFA", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" },
  playerCount: { background: "#7C3AED", borderRadius: "20px", padding: "2px 10px", fontSize: "0.8rem", fontWeight: 700, color: "#fff" },
  playerList: { display: "flex", flexDirection: "column", gap: "8px" },
  playerRow: { display: "flex", alignItems: "center", gap: "10px", background: "#0F0A1E", borderRadius: "10px", padding: "10px 12px" },
  avatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED, #F97316)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "0.9rem", flexShrink: 0,
  },
  playerName: { flex: 1, fontWeight: 600, color: "#F5F3FF" },
  hostBadge: {
    background: "rgba(249,115,22,0.2)", color: "#F97316",
    fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px",
    borderRadius: "20px", border: "1px solid rgba(249,115,22,0.4)", letterSpacing: "0.05em",
  },
  youBadge: {
    background: "rgba(124,58,237,0.2)", color: "#A78BFA",
    fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px",
    borderRadius: "20px", border: "1px solid rgba(124,58,237,0.4)", letterSpacing: "0.05em",
  },
  chatCard: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "16px",
    padding: "14px",
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  chatTitle: { fontWeight: 700, color: "#A78BFA", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 },
  chatMessages: {
    maxHeight: "130px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "4px 0",
    minHeight: "40px",
  },
  chatEmpty: { color: "#4B3A6E", fontSize: "0.8rem", textAlign: "center", margin: "8px 0" },
  chatMsg: { fontSize: "0.85rem", lineHeight: 1.4, color: "#F5F3FF" },
  chatName: { fontWeight: 700, fontSize: "0.8rem" },
  chatText: { color: "#E2D9F3" },
  emoteRow: { display: "flex", gap: "6px", flexWrap: "wrap" },
  emoteBtn: {
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.25)",
    borderRadius: "8px",
    fontSize: "1.1rem",
    padding: "4px 8px",
    cursor: "pointer",
    transition: "transform 0.1s",
    lineHeight: 1.3,
  },
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
  error: {
    color: "#EF4444", fontSize: "0.85rem",
    background: "rgba(239,68,68,0.1)", borderRadius: "8px", padding: "8px 12px",
  },
  startBtn: {
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    color: "#fff",
    padding: "18px 48px",
    borderRadius: "16px",
    fontWeight: 800,
    fontSize: "1.1rem",
    boxShadow: "0 4px 24px rgba(124,58,237,0.5)",
    transition: "all 0.15s",
    width: "100%",
    maxWidth: "360px",
  },
  startBtnDisabled: {
    background: "#231645", color: "#A78BFA", boxShadow: "none", cursor: "not-allowed",
  },
  hostButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
    maxWidth: "360px",
  },
  cancelBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: "14px",
    background: "transparent",
    color: "#EF4444",
    fontWeight: 700,
    fontSize: "0.95rem",
    border: "1.5px solid rgba(239,68,68,0.35)",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  rules: {
    display: "flex", flexDirection: "column", gap: "6px",
    color: "#A78BFA", fontSize: "0.85rem", textAlign: "center", lineHeight: 1.8,
  },
};
