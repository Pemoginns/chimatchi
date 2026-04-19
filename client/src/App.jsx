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

  useEffect(() => {
    socket.connect();

    socket.on("game:created", ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
    });

    socket.on("game:joined", ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen("waiting");
      setError(null);
    });

    socket.on("room:update", (data) => {
      setRoom(data);
      if (data.state === "waiting" && screen !== "lobby") {
        setScreen("waiting");
        setRoundData(null);
        setChoicesData(null);
        setRevealData(null);
        setGameOverData(null);
      }
    });

    socket.on("countdown:tick", ({ count }) => {
      setCountdownValue(count);
      setScreen("countdown");
    });

    socket.on("round:word", (data) => {
      setRoundData(data);
      setChoicesData(null);
      setRevealData(null);
      setScreen("round");
    });

    socket.on("round:choices", (data) => {
      setChoicesData(data);
      setRevealData(null);
    });

    socket.on("round:reveal", (data) => {
      setRevealData(data);
    });

    socket.on("game:over", (data) => {
      setGameOverData(data);
      setScreen("gameover");
    });

    socket.on("error", ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off("game:created");
      socket.off("game:joined");
      socket.off("room:update");
      socket.off("countdown:tick");
      socket.off("round:word");
      socket.off("round:choices");
      socket.off("round:reveal");
      socket.off("game:over");
      socket.off("error");
    };
  }, [screen]);

  const handleCreate = (playerName) => {
    socket.emit("game:create", { playerName });
  };

  const handleJoin = (code, playerName) => {
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
        <Lobby onCreate={handleCreate} onJoin={handleJoin} error={error} />
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
