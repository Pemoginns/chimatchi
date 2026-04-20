const fs = require("fs");
const path = require("path");

const GAMES_FILE    = path.join(__dirname, "games.json");
const SESSIONS_FILE = path.join(__dirname, "sessions.json");
const USERS_FILE    = path.join(__dirname, "users.json");

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

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")); }
  catch { return []; }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function findUserByUsername(username) {
  return readUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
}

function findUserById(userId) {
  return readUsers().find(u => u.userId === userId);
}

function createUser(data) {
  const users = readUsers();
  users.push(data);
  writeUsers(users);
}

function updateUserStats(userId, { win = false }) {
  const users = readUsers();
  const idx = users.findIndex(u => u.userId === userId);
  if (idx === -1) return;
  users[idx].gamesPlayed = (users[idx].gamesPlayed || 0) + 1;
  if (win) users[idx].wins = (users[idx].wins || 0) + 1;
  writeUsers(users);
}

module.exports = {
  logGame, readLog,
  upsertSession, readSessions,
  readUsers, findUserByUsername, findUserById, createUser, updateUserStats,
};
