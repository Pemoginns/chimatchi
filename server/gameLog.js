const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "games.json");

function readLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  } catch {
    return [];
  }
}

function logGame(entry) {
  const log = readLog();
  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

module.exports = { logGame, readLog };
