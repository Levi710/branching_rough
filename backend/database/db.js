import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Database(join(__dirname, 'atonement.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migration: Add user_id column if it doesn't exist (for existing databases)
try {
  db.prepare("ALTER TABLE conversations ADD COLUMN user_id TEXT").run();
} catch (e) {
  // Column already exists or table doesn't exist yet
}

export default db;
