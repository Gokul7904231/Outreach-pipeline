const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// Default initial state
const defaultDb = {
  templates: [
    {
      id: "template_1",
      name: "Standard B2B SaaS Pitch",
      subject: "Partnership opportunity for {{company}}",
      body: "Hi {{first_name}},\n\nI was looking at your work as {{job_title}} at {{company}} and wanted to connect.\n\nWe build tools that automate outbound outreach campaigns. Let me know if you are open to a chat.\n\nBest,\nGokul",
      created_at: new Date().toISOString()
    }
  ],
  history: []
};

// Ensure data folder and db.json exist
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf8");
  }
}

// Read database contents
function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error reading db.json, returning defaults:", error.message);
    return defaultDb;
  }
}

// Write database contents
function writeDb(data) {
  initDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("❌ Error writing db.json:", error.message);
    return false;
  }
}

// Get all history logs
function fetchHistoryLogs() {
  const db = readDb();
  return db.history || [];
}

// Add a history log
function addHistoryLog(log) {
  const db = readDb();
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  db.history = db.history || [];
  db.history.unshift(newLog); // prepend to show newest first
  writeDb(db);
  return newLog;
}

// Get templates
function getTemplates() {
  const db = readDb();
  return db.templates || [];
}

module.exports = {
  fetchHistoryLogs,
  addHistoryLog
};
