import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import Countdown from "./components/Countdown";
import GameRound from "./components/GameRound";
import GameOver from "./components/GameOver";
import AdminPage from "./components/AdminPage";

const STORAGE_KEY = "pondre_session";
const AUTH_KEY = "pondre_auth";

export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [playerId, setPlayerId] = useState(null);
  const [room, setRoom] = useState(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [roundData, setRoundData] = useState(null);
  const [choicesData, setChoicesData] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const screenRef = React.useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const isRejoinAttempt = React.useRef(false);

  // Restore auth session on load
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) return;
    try {
      const { token, user } = JSON.parse(saved);
      if (token && user) {
        setAuthToken(token);
        setAuthUser(user);
        // Refresh user data from server
        fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.user) {
              setAuthUser(data.user);
              localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user: data.user }));
            } else {
              localStorage.removeItem(AUTH_KEY);
              setAuthUser(null);
              setAuthToken(null);
            }
          })
          .catch(() => {});
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const { roomId: savedRoomId, token: savedToken } = JSON.parse(saved);
        if (savedRoomId && savedToken) {
          isRejoinAttempt.current = true;
          socket.emit("game:rejoin", { roomId: savedRoomId, token: savedToken });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    const onCreated = ({ roomId, playerId, token }) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, token }));
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
      setLoading(false);
      setChatMessages([]);
    };

    const onJoined = ({ roomId, playerId, token }) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, token }));
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
      setLoading(false);
      setChatMessages([]);
    };

    const onRejoined = ({ playerId, roomData, roundData: rd, choicesData: cd }) => {
      isRejoinAttempt.current = false;
      setPlayerId(playerId);
      setRoom(roomData);
      setError(null);
      setLoading(false);

      if (rd) {
        setRoundData(rd);
        setChoicesData(cd || null);
        setRevealData(null);
        setScreen("round");
      } else {
        setRoundData(null);
        setChoicesData(null);
        setRevealData(null);
        setScreen("waiting");
      }
    };

    const onRoomUpdate = (data) => {
      setRoom(data);
      if (data.state === "waiting" && screenRef.current !== "lobby") {
        setScreen("waiting");
        setRoundData(null);
        setChoicesData(null);
        setRevealData(null);
        setGameOverData(null);
        setChatMessages([]);
      }
    };

    const onCountdown = ({ count }) => {
      setCountdownValue(count);
      setScreen("countdown");
    };

    const onRoundWord = (data) => {
      setRoundData(data);
      setChoicesData(null);
      setRevealData(null);
      setScreen("round");
    };

    const onChoices = (data) => {
      setChoicesData(data);
      setRevealData(null);
    };

    const onReveal = (data) => setRevealData(data);

    const onGameOver = (data) => {
      setGameOverData(data);
      setScreen("gameover");
      // Refresh user stats after game ends
      if (authToken) {
        fetch("/api/auth/me", { headers: { Authorization: `Bearer ${authToken}` } })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.user) {
              setAuthUser(data.user);
              localStorage.setItem(AUTH_KEY, JSON.stringify({ token: authToken, user: data.user }));
            }
          })
          .catch(() => {});
      }
    };

    const onChatMessage = (msg) => {
      setChatMessages(prev => [...prev.slice(-99), msg]);
    };

    const onCancelled = () => {
      localStorage.removeItem(STORAGE_KEY);
      setScreen("lobby");
      setPlayerId(null);
      setRoom(null);
      setChatMessages([]);
      socket.disconnect();
      socket.connect();
    };

    const onError = ({ message }) => {
      if (isRejoinAttempt.current) {
        isRejoinAttempt.current = false;
        localStorage.removeItem(STORAGE_KEY);
        setScreen("lobby");
      }
      setError(message);
      setLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("game:created", onCreated);
    socket.on("game:joined", onJoined);
    socket.on("game:rejoined", onRejoined);
    socket.on("room:update", onRoomUpdate);
    socket.on("countdown:tick", onCountdown);
    socket.on("round:word", onRoundWord);
    socket.on("round:choices", onChoices);
    socket.on("round:reveal", onReveal);
    socket.on("game:over", onGameOver);
    socket.on("chat:message", onChatMessage);
    socket.on("game:cancelled", onCancelled);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("game:created", onCreated);
      socket.off("game:joined", onJoined);
      socket.off("game:rejoined", onRejoined);
      socket.off("room:update", onRoomUpdate);
      socket.off("countdown:tick", onCountdown);
      socket.off("round:word", onRoundWord);
      socket.off("round:choices", onChoices);
      socket.off("round:reveal", onReveal);
      socket.off("game:over", onGameOver);
      socket.off("chat:message", onChatMessage);
      socket.off("game:cancelled", onCancelled);
      socket.off("error", onError);
    };
  }, [authToken]);

  const handleCreate = (playerName, difficulty, language) => {
    setLoading(true);
    setError(null);
    socket.emit("game:create", { playerName, difficulty, language, userId: authUser?.userId || null });
  };

  const handleJoin = (code, playerName) => {
    setLoading(true);
    setError(null);
    socket.emit("game:join", { roomId: code.toUpperCase(), playerName, userId: authUser?.userId || null });
  };

  const handleStart = () => {
    socket.emit("game:start");
  };

  const handleAnswer = (answer) => {
    socket.emit("answer:submit", { answer });
  };

  const handleRestart = () => {
    socket.emit("game:restart");
  };

  const handleCancelGame = () => {
    socket.emit("game:cancel");
  };

  const handleSendChat = (message) => {
    socket.emit("chat:send", { message });
  };

  const handleBackToLobby = () => {
    localStorage.removeItem(STORAGE_KEY);
    setScreen("lobby");
    setPlayerId(null);
    setRoom(null);
    setRoundData(null);
    setChoicesData(null);
    setRevealData(null);
    setGameOverData(null);
    setChatMessages([]);
    socket.disconnect();
    socket.connect();
  };

  const handleAuthSuccess = (user, token) => {
    setAuthUser(user);
    setAuthToken(token);
  };

  const handleSignOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUser(null);
    setAuthToken(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {screen === "admin" && (
        <AdminPage onBack={() => setScreen("lobby")} />
      )}
      {screen === "lobby" && (
        <Lobby
          onCreate={handleCreate}
          onJoin={handleJoin}
          error={error}
          loading={loading}
          onAdminAccess={() => setScreen("admin")}
          authUser={authUser}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
        />
      )}
      {screen === "waiting" && room && (
        <WaitingRoom
          room={room}
          playerId={playerId}
          onStart={handleStart}
          onCancel={handleCancelGame}
          error={error}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
        />
      )}
      {screen === "countdown" && (
        <Countdown value={countdownValue} />
      )}
      {screen === "round" && roundData && (
        <GameRound
          roundData={roundData}
          choicesData={choicesData}
          revealData={revealData}
          playerId={playerId}
          room={room}
          onAnswer={handleAnswer}
        />
      )}
      {screen === "gameover" && gameOverData && (
        <GameOver
          data={gameOverData}
          playerId={playerId}
          isHost={room?.host === playerId}
          onRestart={handleRestart}
          onLobby={handleBackToLobby}
          chatMessages={chatMessages}
          onSendChat={handleSendChat}
        />
      )}
    </div>
  );
}
