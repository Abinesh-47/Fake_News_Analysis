import Database from 'better-sqlite3';
const db = new Database('analytics.db');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='reports'").get();
console.log('REPORTS TABLE SCHEMA:', schema || 'NOT FOUND');
db.close();
