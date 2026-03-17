import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('analytics.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    news_title TEXT,
    text TEXT,
    label TEXT,
    credibility_score REAL,
    context TEXT,
    location TEXT,
    spreaders TEXT,
    technical_metadata TEXT,
    sources TEXT,
    model_results TEXT,
    source_links TEXT,
    diffusion_data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS diffusion_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id INTEGER,
    timestamp INTEGER,
    reach INTEGER,
    depth INTEGER,
    velocity REAL,
    FOREIGN KEY(news_id) REFERENCES news_items(id)
  );
`);

export default db;
