import React, { useEffect, useState } from "react";
import { playCountdownTick, playGameStart } from "../sounds";

export default function Countdown({ value }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    playGameStart();
  }, []);

  useEffect(() => {
    setAnimate(true);
    playCountdownTick();
    const t = setTimeout(() => setAnimate(false), 400);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={styles.container}>
      <p style={styles.label}>Get ready!</p>
      <div
        style={{
          ...styles.circle,
          transform: animate ? "scale(1.2)" : "scale(1)",
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {value}
      </div>
      <p style={styles.sub}>Round starting...</p>
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
    gap: "20px",
    background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3A 100%)",
  },
  label: {
    color: "#A78BFA",
    fontSize: "1.2rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  circle: {
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "5rem",
    fontWeight: 900,
    color: "#fff",
    boxShadow: "0 0 60px rgba(124,58,237,0.6)",
  },
  sub: { color: "#A78BFA", fontSize: "1rem", fontWeight: 600 },
};
