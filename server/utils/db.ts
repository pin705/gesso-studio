import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/** Everything machine-local lives here: the SQLite database and logs. Project art stays in project folders. */
export const dataDir = () => path.resolve(process.env.GESSO_HOME ?? path.join(homedir(), '.gesso'));

const MIGRATIONS = [
  `CREATE TABLE projects (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     path TEXT NOT NULL UNIQUE,
     created_at INTEGER NOT NULL,
     opened_at INTEGER NOT NULL
   );
   CREATE TABLE assets (
     id INTEGER PRIMARY KEY,
     project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     key TEXT NOT NULL,
     type TEXT NOT NULL DEFAULT 'other',
     style TEXT NOT NULL DEFAULT '',
     width REAL NOT NULL DEFAULT 0,
     height REAL NOT NULL DEFAULT 0,
     duration REAL NOT NULL DEFAULT 0,
     frames INTEGER NOT NULL DEFAULT 0,
     nine_slice TEXT,
     status TEXT NOT NULL DEFAULT 'draft',
     hash TEXT NOT NULL DEFAULT '',
     updated_at INTEGER NOT NULL,
     UNIQUE (project_id, key)
   );
   CREATE TABLE revisions (
     id INTEGER PRIMARY KEY,
     asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
     number INTEGER NOT NULL,
     svg TEXT NOT NULL,
     hash TEXT NOT NULL,
     source TEXT NOT NULL,
     note TEXT NOT NULL DEFAULT '',
     lint TEXT,
     critique TEXT,
     created_at INTEGER NOT NULL,
     UNIQUE (asset_id, number)
   );
   CREATE TABLE feedback (
     id INTEGER PRIMARY KEY,
     asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
     revision INTEGER,
     body TEXT NOT NULL,
     x REAL,
     y REAL,
     status TEXT NOT NULL DEFAULT 'open',
     reply TEXT NOT NULL DEFAULT '',
     created_at INTEGER NOT NULL,
     resolved_at INTEGER
   );
   CREATE TABLE activity (
     id INTEGER PRIMARY KEY,
     project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
     actor TEXT NOT NULL,
     kind TEXT NOT NULL,
     message TEXT NOT NULL,
     asset TEXT,
     created_at INTEGER NOT NULL
   );
   CREATE INDEX activity_project ON activity (project_id, id DESC);
   CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`
];

let db: DatabaseSync | undefined;

export function useDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(dataDir(), { recursive: true });
  db = new DatabaseSync(path.join(dataDir(), 'gesso.db'));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;');
  const { user_version: version } = db.prepare('PRAGMA user_version').get() as { user_version: number };
  for (let index = version; index < MIGRATIONS.length; index += 1) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[index]!);
      db.exec(`PRAGMA user_version = ${index + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  return db;
}

export function getSetting(key: string): string | undefined {
  return (useDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined)?.value;
}

export function setSetting(key: string, value: string): void {
  useDb().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, value);
}
