import React, { useState, useEffect, useRef } from "react";

export default function PasswordModal({ onSuccess, onClose }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const attempt = () => {
    if (value === "letsthink") {
      onSuccess();
    } else {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{ ...styles.modal, animation: shake ? "shake 0.5s" : "none" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.lockIcon}>🔒</div>
        <h2 style={styles.title}>Admin Access</h2>
        <p style={styles.sub}>Enter password to continue</p>
        <input
          ref={inputRef}
          type="password"
          style={styles.input}
          placeholder="Password"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
        />
        <button style={styles.btn} onClick={attempt}>Unlock</button>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-8px)}
          80%{transform:translateX(8px)}
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#1A1033",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "20px",
    padding: "36px 28px",
    width: "100%",
    maxWidth: "340px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 0 60px rgba(124,58,237,0.2)",
  },
  lockIcon: { fontSize: "2.5rem" },
  title: { color: "#F5F3FF", fontWeight: 900, fontSize: "1.4rem" },
  sub: { color: "#A78BFA", fontSize: "0.85rem", marginBottom: "4px" },
  input: {
    width: "100%",
    background: "#0F0A1E",
    border: "1.5px solid rgba(124,58,237,0.4)",
    borderRadius: "12px",
    color: "#F5F3FF",
    fontSize: "1rem",
    padding: "14px 16px",
    fontFamily: "inherit",
    outline: "none",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
    color: "#fff",
    fontWeight: 800,
    fontSize: "1rem",
    cursor: "pointer",
    border: "none",
    fontFamily: "inherit",
    marginTop: "4px",
  },
};
