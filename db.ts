import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  db = new Database('analytics.db');
  console.log(`[DB] Database initialized successfully.`);
} catch (err: any) {
  console.error(`[DB ERROR] Failed to initialize better-sqlite3:`, err.message);
  // Re-throw to allow top-level catch in server.ts to report it
  throw err;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    inputText TEXT,
    extractedText TEXT,
    result TEXT,
    sources TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
