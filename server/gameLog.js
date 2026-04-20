const fs = require("fs");
const path = require("path");

const GAMES_FILE    = path.join(__dirname, "games.json");
const SESSIONS_FILE = path.join(__dirname, "sessions.json");

function readLog() {
  try { return JSON.parse(fs.readFileSync(GAMES_FILE, "utf8")); }
  catch { return []; }
}

function logGame(entry) {
  const log = readLog();
  log.push(entry);
  fs.writeFileSync(GAMES_FILE, JSON.stringify(log, null, 2));
}

function readSessions() {
  try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8")); }
  catch { return []; }
}

function upsertSession(roomId, data) {
  const sessions = readSessions();
  const idx = sessions.findIndex(s => s.roomId === roomId);
  if (idx === -1) {
    sessions.push({ roomId, ...data });
  } else {
    sessions[idx] = { ...sessions[idx], ...data };
  }
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

module.exports = { logGame, readLog, upsertSession, readSessions };
