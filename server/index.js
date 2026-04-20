const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { generateRounds } = require("./vocabulary");
const { logGame, readLog, upsertSession, readSessions } = require("./gameLog");

const app = express();
app.use(cors());
app.use(rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "../client/dist")));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"],
});

const PORT = process.env.PORT || 3001;
const POINTS_TO_WIN = 5;
const WORD_DISPLAY_MS = 3000;
const ANSWER_WINDOW_MS = 8000;
const COUNTDOWN_SECS = 2;
const RECONNECT_GRACE_MS = 10000;

const rooms = new Map();
// token -> { timer, roomId, socketId }
const pendingDisconnects = new Map();

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateToken() {
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

function getRoom(id) {
  return rooms.get(id);
}

function broadcastRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  io.to(roomId).emit("room:update", {
    roomId,
    host: room.host,
    players: room.players,
    state: room.state,
    difficulty: room.difficulty,
  });
}

function startCountdown(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  upsertSession(roomId, { status: "started", startedAt: new Date().toISOString() });
  room.state = "countdown";
  broadcastRoom(roomId);

  let count = COUNTDOWN_SECS;
  io.to(roomId).emit("countdown:tick", { count });

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      io.to(roomId).emit("countdown:tick", { count });
    } else {
      clearInterval(interval);
      startRound(roomId);
    }
  }, 1000);
}

function startRound(roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  if (room.roundIndex >= room.rounds.length) {
    endGame(roomId);
    return;
  }

  const round = room.rounds[room.roundIndex];
  room.state = "showing_word";
  room.roundAnswered = false;
  room.currentRound = round;

  io.to(roomId).emit("round:word", {
    prompt: round.prompt,
    direction: round.direction,
    roundIndex: room.roundIndex,
    totalRounds: room.rounds.length,
    scores: room.scores,
  });

  room.wordTimer = setTimeout(() => {
    showChoices(roomId);
  }, WORD_DISPLAY_MS);
}

function showChoices(roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  room.state = "answering";
  const round = room.currentRound;

  io.to(roomId).emit("round:choices", {
    prompt: round.prompt,
    direction: round.direction,
    choices: round.choices,
    roundIndex: room.roundIndex,
  });

  room.answerTimer = setTimeout(() => {
    revealAnswer(roomId, null);
  }, ANSWER_WINDOW_MS);
}

function revealAnswer(roomId, winnerId) {
  const room = getRoom(roomId);
  if (!room || room.state === "revealing") return;
  room.state = "revealing";

  clearTimeout(room.answerTimer);

  const round = room.currentRound;
  io.to(roomId).emit("round:reveal", {
    correctAnswer: round.correctAnswer,
    winnerId,
    scores: room.scores,
  });

  const winner = checkWinner(room);
  if (winner) {
    setTimeout(() => endGame(roomId, winner), 2000);
    return;
  }

  room.roundIndex++;
  setTimeout(() => startRound(roomId), 2500);
}

function checkWinner(room) {
  for (const [id, score] of Object.entries(room.scores)) {
    if (score >= POINTS_TO_WIN) return id;
  }
  return null;
}

function endGame(roomId, winnerId) {
  const room = getRoom(roomId);
  if (!room) return;
  room.state = "game_over";
  const winnerPlayer = room.players.find(p => p.id === winnerId);
  logGame({
    gameId: roomId,
    timestamp: new Date().toISOString(),
    difficulty: room.difficulty || 1,
    players: room.players.map(p => ({ name: p.name, score: room.scores[p.id] || 0 })),
    winner: winnerPlayer ? winnerPlayer.name : "No one",
    roundsPlayed: room.roundIndex,
  });
  upsertSession(roomId, {
    status: "completed",
    completedAt: new Date().toISOString(),
    winner: winnerPlayer ? winnerPlayer.name : "No one",
    roundsPlayed: room.roundIndex,
  });
  io.to(roomId).emit("game:over", {
    winnerId,
    winnerName: winnerPlayer ? winnerPlayer.name : "No one",
    scores: room.scores,
    players: room.players,
  });
}

// Called after the 10s grace period expires — actually removes the player.
function actuallyRemovePlayer(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return;

  room.players = room.players.filter(p => p.id !== socketId);
  delete room.scores[socketId];

  if (room.players.length === 0) {
    clearTimeout(room.wordTimer);
    clearTimeout(room.answerTimer);
    if (room.state !== "game_over") {
      upsertSession(roomId, { status: "abandoned", abandonedAt: new Date().toISOString() });
    }
    rooms.delete(roomId);
    return;
  }

  if (room.host === socketId) {
    room.host = room.players[0].id;
  }

  const activeStates = ["countdown", "showing_word", "answering", "revealing"];
  if (activeStates.includes(room.state) && room.players.length < 2) {
    clearTimeout(room.wordTimer);
    clearTimeout(room.answerTimer);
    endGame(roomId, room.players[0].id);
    return;
  }

  broadcastRoom(roomId);
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("game:create", ({ playerName, difficulty }) => {
    const diff = Math.min(3, Math.max(1, parseInt(difficulty) || 1));
    const roomId = generateId();
    const token = generateToken();
    const player = { id: socket.id, token, name: String(playerName || "Host").trim().slice(0, 20) || "Host" };
    rooms.set(roomId, {
      host: socket.id,
      players: [player],
      state: "waiting",
      difficulty: diff,
      rounds: generateRounds(20, diff),
      roundIndex: 0,
      scores: { [socket.id]: 0 },
      currentRound: null,
      roundAnswered: false,
      wordTimer: null,
      answerTimer: null,
    });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit("game:created", { roomId, playerId: socket.id, token });
    broadcastRoom(roomId);
    upsertSession(roomId, {
      createdAt: new Date().toISOString(),
      host: player.name,
      difficulty: diff,
      players: [player.name],
      status: "waiting",
    });
  });

  socket.on("game:join", ({ roomId, playerName }) => {
    const normalizedId = String(roomId || "").trim().toUpperCase().slice(0, 6);
    const room = getRoom(normalizedId);
    if (!room) {
      socket.emit("error", { message: "Game not found" });
      return;
    }
    if (room.state !== "waiting") {
      socket.emit("error", { message: "Game already started" });
      return;
    }
    const token = generateToken();
    const player = { id: socket.id, token, name: String(playerName || "Player").trim().slice(0, 20) || "Player" };
    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(normalizedId);
    socket.roomId = normalizedId;
    socket.emit("game:joined", { roomId: normalizedId, playerId: socket.id, token });
    broadcastRoom(normalizedId);
    upsertSession(normalizedId, { players: room.players.map(p => p.name) });
  });

  socket.on("game:rejoin", ({ roomId, token }) => {
    const normalizedId = String(roomId || "").trim().toUpperCase().slice(0, 6);
    const room = getRoom(normalizedId);
    if (!room) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    const player = room.players.find(p => p.token === token);
    if (!player) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    // Cancel the pending disconnect timer if still within grace period
    const pending = pendingDisconnects.get(token);
    if (pending) {
      clearTimeout(pending.timer);
      pendingDisconnects.delete(token);
    }

    const oldSocketId = player.id;

    // Update all references from old socket.id to new socket.id
    room.scores[socket.id] = room.scores[oldSocketId] || 0;
    if (oldSocketId !== socket.id) delete room.scores[oldSocketId];
    if (room.host === oldSocketId) room.host = socket.id;
    player.id = socket.id;

    socket.join(normalizedId);
    socket.roomId = normalizedId;

    // Build response with enough state to restore the correct screen
    const response = {
      roomId: normalizedId,
      playerId: socket.id,
      token,
      roomData: {
        roomId: normalizedId,
        host: room.host,
        players: room.players,
        state: room.state,
        difficulty: room.difficulty,
      },
    };

    const activeStates = ["showing_word", "answering", "revealing"];
    if (activeStates.includes(room.state) && room.currentRound) {
      response.roundData = {
        prompt: room.currentRound.prompt,
        direction: room.currentRound.direction,
        roundIndex: room.roundIndex,
        totalRounds: room.rounds.length,
        scores: room.scores,
      };
      if (room.state === "answering" || room.state === "revealing") {
        response.choicesData = {
          prompt: room.currentRound.prompt,
          direction: room.currentRound.direction,
          choices: room.currentRound.choices,
          roundIndex: room.roundIndex,
        };
      }
    }

    socket.emit("game:rejoined", response);
    broadcastRoom(normalizedId);
  });

  socket.on("game:start", () => {
    const roomId = socket.roomId;
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return;
    if (room.players.length < 2) {
      socket.emit("error", { message: "Need at least 2 players" });
      return;
    }
    startCountdown(roomId);
  });

  socket.on("answer:submit", ({ answer }) => {
    const roomId = socket.roomId;
    const room = getRoom(roomId);
    if (!room || room.state !== "answering" || room.roundAnswered) return;

    const round = room.currentRound;
    if (answer === round.correctAnswer) {
      room.roundAnswered = true;
      room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
      revealAnswer(roomId, socket.id);
    }
  });

  socket.on("game:restart", () => {
    const roomId = socket.roomId;
    const room = getRoom(roomId);
    if (!room || room.host !== socket.id) return;

    clearTimeout(room.wordTimer);
    clearTimeout(room.answerTimer);

    room.state = "waiting";
    room.rounds = generateRounds(20, room.difficulty);
    room.roundIndex = 0;
    room.scores = {};
    room.players.forEach(p => { room.scores[p.id] = 0; });
    room.currentRound = null;
    room.roundAnswered = false;

    broadcastRoom(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const token = player.token;

    // Give the player 10 seconds to reconnect before removing them
    const timer = setTimeout(() => {
      pendingDisconnects.delete(token);
      actuallyRemovePlayer(roomId, socket.id);
    }, RECONNECT_GRACE_MS);

    pendingDisconnects.set(token, { timer, roomId, socketId: socket.id });
  });
});

app.get("/api/games", (_req, res) => {
  res.json(readLog());
});

app.get("/api/sessions", (_req, res) => {
  res.json(readSessions());
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
