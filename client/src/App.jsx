import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import Countdown from "./components/Countdown";
import GameRound from "./components/GameRound";
import GameOver from "./components/GameOver";

export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [room, setRoom] = useState(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [roundData, setRoundData] = useState(null);
  const [choicesData, setChoicesData] = useState(null);
  const [revealData, setRevealData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const screenRef = React.useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    socket.connect();

    const onCreated = ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
      setLoading(false);
    };

    const onJoined = ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
      setLoading(false);
    };

    const onRoomUpdate = (data) => {
      setRoom(data);
      if (data.state === "waiting" && screenRef.current !== "lobby") {
        setScreen("waiting");
        setRoundData(null);
        setChoicesData(null);
        setRevealData(null);
        setGameOverData(null);
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
    };

    const onError = ({ message }) => {
      setError(message);
      setLoading(false);
    };

    socket.on("game:created", onCreated);
    socket.on("game:joined", onJoined);
    socket.on("room:update", onRoomUpdate);
    socket.on("countdown:tick", onCountdown);
    socket.on("round:word", onRoundWord);
    socket.on("round:choices", onChoices);
    socket.on("round:reveal", onReveal);
    socket.on("game:over", onGameOver);
    socket.on("error", onError);

    return () => {
      socket.off("game:created", onCreated);
      socket.off("game:joined", onJoined);
      socket.off("room:update", onRoomUpdate);
      socket.off("countdown:tick", onCountdown);
      socket.off("round:word", onRoundWord);
      socket.off("round:choices", onChoices);
      socket.off("round:reveal", onReveal);
      socket.off("game:over", onGameOver);
      socket.off("error", onError);
    };
  }, []);

  const handleCreate = (playerName, difficulty) => {
    setLoading(true);
    setError(null);
    socket.emit("game:create", { playerName, difficulty });
  };

  const handleJoin = (code, playerName) => {
    setLoading(true);
    setError(null);
    socket.emit("game:join", { roomId: code.toUpperCase(), playerName });
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

  const handleBackToLobby = () => {
    setScreen("lobby");
    setRoomId(null);
    setPlayerId(null);
    setRoom(null);
    setRoundData(null);
    setChoicesData(null);
    setRevealData(null);
    setGameOverData(null);
    socket.disconnect();
    socket.connect();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {screen === "lobby" && (
        <Lobby onCreate={handleCreate} onJoin={handleJoin} error={error} loading={loading} />
      )}
      {screen === "waiting" && room && (
        <WaitingRoom
          room={room}
          playerId={playerId}
          onStart={handleStart}
          error={error}
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
        />
      )}
    </div>
  );
}
