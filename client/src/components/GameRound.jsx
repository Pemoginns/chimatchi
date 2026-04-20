import React, { useState, useEffect, useRef } from "react";

const WORD_DISPLAY_MS = 3000;
const ANSWER_WINDOW_MS = 8000;

const LANG_META = {
  french:  { flag: "🇫🇷", name: "French" },
  irish:   { flag: "🇮🇪", name: "Irish" },
  spanish: { flag: "🇪🇸", name: "Spanish" },
};

export default function GameRound({ roundData, choicesData, revealData, playerId, room, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [wordProgress, setWordProgress] = useState(100);
  const [answerProgress, setAnswerProgress] = useState(100);
  const wordInterval = useRef(null);
  const answerInterval = useRef(null);

  const lang = LANG_META[roundData.language] || LANG_META.french;
  const toEnglish = roundData.direction?.includes("→en");
  const dirDisplay = toEnglish ? `${lang.flag} → 🇬🇧` : `🇬🇧 → ${lang.flag}`;
  const wordLabel = toEnglish ? `${lang.name} word` : "English word";
  const choicesLabel = toEnglish ? "What does it mean in English?" : `What does it mean in ${lang.name}?`;

  useEffect(() => {
    setSelected(null);
    setWordProgress(100);
    setAnswerProgress(100);

    const start = Date.now();
    wordInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / WORD_DISPLAY_MS) * 100);
      setWordProgress(pct);
      if (pct === 0) clearInterval(wordInterval.current);
    }, 50);

    return () => clearInterval(wordInterval.current);
  }, [roundData?.roundIndex]);

  useEffect(() => {
    if (!choicesData) return;
    setAnswerProgress(100);
    const start = Date.now();
    answerInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / ANSWER_WINDOW_MS) * 100);
      setAnswerProgress(pct);
      if (pct === 0) clearInterval(answerInterval.current);
    }, 50);
    return () => clearInterval(answerInterval.current);
  }, [choicesData]);

  const handleAnswer = (choice) => {
    if (selected || revealData) return;
    setSelected(choice);
    onAnswer(choice);
  };

  const getChoiceStyle = (choice) => {
    if (!revealData) {
      return selected === choice ? styles.choiceSelected : styles.choice;
    }
    if (choice === revealData.correctAnswer) return styles.choiceCorrect;
    if (selected === choice) return styles.choiceWrong;
    return styles.choiceDim;
  };

  const scores = revealData?.scores || roundData?.scores || {};

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div style={styles.roundInfo}>
          <span style={styles.roundNum}>Round {(roundData.roundIndex || 0) + 1}</span>
          <span style={styles.direction}>{dirDisplay}</span>
        </div>
        <div style={styles.scoreRow}>
          {room?.players?.map(p => (
            <div key={p.id} style={styles.scoreChip}>
              <span style={styles.scoreName}>{p.name.split(" ")[0]}</span>
              <span style={{ ...styles.scoreVal, color: p.id === playerId ? "#A78BFA" : "#F97316" }}>
                {scores[p.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.wordSection}>
        <div style={styles.timerBar}>
          <div style={{ ...styles.timerFill, width: `${choicesData ? answerProgress : wordProgress}%`, background: choicesData ? "#F97316" : "#7C3AED" }} />
        </div>

        <div style={styles.wordCard}>
          <p style={styles.wordLabel}>{wordLabel}</p>
          <p style={styles.word}>{roundData.prompt}</p>
          {!choicesData && !revealData && (
            <p style={styles.wordHint}>Memorize this word...</p>
          )}
        </div>
      </div>

      {(choicesData || revealData) && (
        <div style={styles.choicesGrid}>
          <p style={styles.choicesLabel}>{choicesLabel}</p>
          {(choicesData?.choices || []).map((choice, i) => (
            <button
              key={i}
              style={getChoiceStyle(choice)}
              onClick={() => handleAnswer(choice)}
              disabled={!!selected || !!revealData}
            >
              {choice}
              {revealData && choice === revealData.correctAnswer && (
                <span style={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
          {revealData && (
            <div style={styles.revealBanner}>
              {revealData.winnerId === playerId
                ? "✅ You got it! +1 point"
                : revealData.winnerId
                ? `⚡ ${room?.players?.find(p => p.id === revealData.winnerId)?.name || "Someone"} was faster!`
                : "⏱ Time's up! No points"}
            </div>
          )}
        </div>
      )}

      {!choicesData && !revealData && (
        <div style={styles.waitingChoices}>
          <div style={styles.dotLoader}>
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}

const choiceBase = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 20px",
  borderRadius: "16px",
  fontWeight: 800,
  fontSize: "1.3rem",
  cursor: "pointer",
  transition: "all 0.15s",
  border: "2px solid transparent",
  flex: 1,
  minHeight: "80px",
  position: "relative",
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  topBar: { padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  roundInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  roundNum: { fontWeight: 800, color: "#F5F3FF", fontSize: "1rem" },
  direction: { color: "#A78BFA", fontSize: "0.8rem" },
  scoreRow: { display: "flex", gap: "8px" },
  scoreChip: {
    background: "#1A1033", borderRadius: "12px", padding: "6px 12px",
    display: "flex", flexDirection: "column", alignItems: "center",
    border: "1px solid rgba(124,58,237,0.3)",
  },
  scoreName: { color: "#A78BFA", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" },
  scoreVal: { fontSize: "1.1rem", fontWeight: 900 },
  wordSection: { flex: 1, display: "flex", flexDirection: "column", padding: "16px", gap: "12px" },
  timerBar: { height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" },
  timerFill: { height: "100%", borderRadius: "3px", transition: "width 0.05s linear" },
  wordCard: {
    flex: 1,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: "#1A1033", borderRadius: "20px", border: "1px solid rgba(124,58,237,0.3)",
    padding: "32px 24px", textAlign: "center", gap: "12px", minHeight: "180px",
  },
  wordLabel: { color: "#A78BFA", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" },
  word: { fontSize: "clamp(2rem, 10vw, 3.5rem)", fontWeight: 900, color: "#F5F3FF", letterSpacing: "-0.02em" },
  wordHint: { color: "#A78BFA", fontSize: "0.85rem" },
  choicesGrid: { display: "flex", flexDirection: "column", padding: "0 16px 24px", gap: "10px", flex: 2 },
  choicesLabel: {
    color: "#A78BFA", fontSize: "0.8rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center", marginBottom: "4px",
  },
  choice: { ...choiceBase, background: "#1A1033", color: "#F5F3FF", border: "2px solid rgba(124,58,237,0.3)" },
  choiceSelected: { ...choiceBase, background: "rgba(124,58,237,0.3)", color: "#F5F3FF", border: "2px solid #7C3AED" },
  choiceCorrect: { ...choiceBase, background: "rgba(34,197,94,0.2)", color: "#22C55E", border: "2px solid #22C55E" },
  choiceWrong: { ...choiceBase, background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "2px solid #EF4444" },
  choiceDim: { ...choiceBase, background: "#0F0A1E", color: "#4B3A6E", border: "2px solid #1A1033" },
  checkmark: { position: "absolute", right: "16px", fontSize: "1.2rem" },
  revealBanner: {
    textAlign: "center", padding: "12px", borderRadius: "12px",
    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
    color: "#F5F3FF", fontWeight: 700, fontSize: "0.95rem",
  },
  waitingChoices: { flex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  dotLoader: { display: "flex", gap: "8px" },
};
