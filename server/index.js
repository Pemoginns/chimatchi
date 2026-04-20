const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { generateRounds } = require("./vocabulary");
const {
  logGame, readLog,
  upsertSession, readSessions,
  readUsers, findUserByUsername, findUserById, createUser, updateUserStats,
} = require("./gameLog");

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));
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
const AUTH_SECRET = process.env.JWT_SECRET || "pondre-secret-2024";
const VALID_LANGUAGES = ["french", "irish", "spanish"];

// ─── Auth helpers ────────────────────────────────────────────────────────────

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  const inputHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === inputHash;
}

function generateAuthToken(userId, username) {
  const payload = Buffer.from(JSON.stringify({ userId, username, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyAuthToken(token) {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const decoded = verifyAuthToken(token);
  if (!decoded) return res.status(401).json({ error: "Invalid token" });
  req.userId = decoded.userId;
  req.username = decoded.username;
  next();
}

// ─── Room management ─────────────────────────────────────────────────────────

const rooms = new Map();
const pendingDisconnects = new Map();

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateToken() {
  return Math.random().toString(36).substring(2, 14).toUpperCase();
}

function generateUserId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
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
    language: room.language,
  });
}

// ─── Game flow ───────────────────────────────────────────────────────────────

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
    language: round.language,
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
    language: round.language,
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

  // Update user account stats
  room.players.forEach(p => {
    if (p.userId) {
      updateUserStats(p.userId, { win: p.id === winnerId });
    }
  });

  logGame({
    gameId: roomId,
    timestamp: new Date().toISOString(),
    difficulty: room.difficulty || 1,
    language: room.language || "french",
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

// ─── Socket handlers ─────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("game:create", ({ playerName, difficulty, language, userId }) => {
    const diff = Math.min(3, Math.max(1, parseInt(difficulty) || 1));
    const lang = VALID_LANGUAGES.includes(language) ? language : "french";
    const roomId = generateId();
    const token = generateToken();
    const player = {
      id: socket.id,
      token,
      name: String(playerName || "Host").trim().slice(0, 20) || "Host",
      userId: userId || null,
    };
    rooms.set(roomId, {
      host: socket.id,
      players: [player],
      state: "waiting",
      difficulty: diff,
      language: lang,
      rounds: generateRounds(20, diff, lang),
      roundIndex: 0,
      scores: { [socket.id]: 0 },
      currentRound: null,
      roundAnswered: false,
      wordTimer: null,
      answerTimer: null,
      chatMessages: [],
    });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit("game:created", { roomId, playerId: socket.id, token });
    broadcastRoom(roomId);
    upsertSession(roomId, {
      createdAt: new Date().toISOString(),
      host: player.name,
      difficulty: diff,
      language: lang,
      players: [player.name],
      status: "waiting",
    });
  });

  socket.on("game:join", ({ roomId, playerName, userId }) => {
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
    const player = {
      id: socket.id,
      token,
      name: String(playerName || "Player").trim().slice(0, 20) || "Player",
      userId: userId || null,
    };
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

    const pending = pendingDisconnects.get(token);
    if (pending) {
      clearTimeout(pending.timer);
      pendingDisconnects.delete(token);
    }

    const oldSocketId = player.id;
    room.scores[socket.id] = room.scores[oldSocketId] || 0;
    if (oldSocketId !== socket.id) delete room.scores[oldSocketId];
    if (room.host === oldSocketId) room.host = socket.id;
    player.id = socket.id;

    socket.join(normalizedId);
    socket.roomId = normalizedId;

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
        language: room.language,
      },
    };

    const activeStates = ["showing_word", "answering", "revealing"];
    if (activeStates.includes(room.state) && room.currentRound) {
      response.roundData = {
        prompt: room.currentRound.prompt,
        direction: room.currentRound.direction,
        language: room.currentRound.language,
        roundIndex: room.roundIndex,
        totalRounds: room.rounds.length,
        scores: room.scores,
      };
      if (room.state === "answering" || room.state === "revealing") {
        response.choicesData = {
          prompt: room.currentRound.prompt,
          direction: room.currentRound.direction,
          language: room.currentRound.language,
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
    room.rounds = generateRounds(20, room.difficulty, room.language || "french");
    room.roundIndex = 0;
    room.scores = {};
    room.players.forEach(p => { room.scores[p.id] = 0; });
    room.currentRound = null;
    room.roundAnswered = false;
    room.chatMessages = [];

    broadcastRoom(roomId);
  });

  socket.on("chat:send", ({ message }) => {
    const roomId = socket.roomId;
    const room = getRoom(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const text = String(message || "").trim().slice(0, 200);
    if (!text) return;

    const msg = {
      playerName: player.name,
      playerId: socket.id,
      message: text,
      timestamp: Date.now(),
    };

    room.chatMessages = room.chatMessages || [];
    room.chatMessages.push(msg);
    if (room.chatMessages.length > 100) room.chatMessages.shift();

    io.to(roomId).emit("chat:message", msg);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = getRoom(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const token = player.token;
    const timer = setTimeout(() => {
      pendingDisconnects.delete(token);
      actuallyRemovePlayer(roomId, socket.id);
    }, RECONNECT_GRACE_MS);

    pendingDisconnects.set(token, { timer, roomId, socketId: socket.id });
  });
});

// ─── Auth REST endpoints ──────────────────────────────────────────────────────

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

app.post("/api/auth/register", authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const name = String(username).trim().slice(0, 20);
  if (name.length < 2) {
    return res.status(400).json({ error: "Username must be at least 2 characters" });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  if (findUserByUsername(name)) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const userId = generateUserId();
  const user = {
    userId,
    username: name,
    passwordHash: hashPassword(String(password)),
    createdAt: new Date().toISOString(),
    wins: 0,
    gamesPlayed: 0,
  };
  createUser(user);
  const token = generateAuthToken(userId, name);
  res.json({ token, user: { userId, username: name, wins: 0, gamesPlayed: 0 } });
});

app.post("/api/auth/login", authLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const user = findUserByUsername(String(username).trim());
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = generateAuthToken(user.userId, user.username);
  res.json({
    token,
    user: { userId: user.userId, username: user.username, wins: user.wins, gamesPlayed: user.gamesPlayed },
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: { userId: user.userId, username: user.username, wins: user.wins, gamesPlayed: user.gamesPlayed } });
});

app.get("/api/users/leaderboard", (req, res) => {
  const users = readUsers();
  const top = users
    .sort((a, b) => (b.wins || 0) - (a.wins || 0))
    .slice(0, 10)
    .map(u => ({ username: u.username, wins: u.wins || 0, gamesPlayed: u.gamesPlayed || 0 }));
  res.json(top);
});

// ─── Existing analytics endpoints ────────────────────────────────────────────

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
