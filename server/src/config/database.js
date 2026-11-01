const path = require('path');
const fs = require('fs');

let db = null;
let isPostgres = false;

// Determine whether to use PostgreSQL or SQLite fallback
if (process.env.DATABASE_URL || process.env.PGHOST) {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
    });
    db = pool;
    isPostgres = true;
    console.log('[Database] Connected to PostgreSQL');
  } catch (err) {
    console.warn('[Database] PostgreSQL connection failed, falling back to SQLite:', err.message);
  }
}

if (!isPostgres) {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, '../../datalens.db');
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[Database] Failed to open SQLite database:', err);
    } else {
      console.log(`[Database] Connected to 100% Free Local SQLite DB at: ${dbPath}`);
    }
  });

  // Wrapper for unified promise-based interface
  db = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        // Normalize PostgreSQL $1, $2 placeholders to SQLite ?
        let normalizedSql = sql;
        if (typeof sql === 'string') {
          normalizedSql = sql.replace(/\$(\d+)/g, '?');
        }

        const trimmed = normalizedSql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
          sqliteDb.all(normalizedSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [], rowCount: (rows || []).length });
          });
        } else {
          sqliteDb.run(normalizedSql, params, function (err) {
            if (err) return reject(err);
            resolve({
              rows: [],
              rowCount: this.changes,
              lastID: this.lastID
            });
          });
        }
      });
    }
  };
}

// Unified query helper
const query = (text, params) => {
  if (isPostgres) {
    return db.query(text, params);
  } else {
    return db.query(text, params);
  }
};

// Initialize tables
const initDatabase = async () => {
  try {
    if (isPostgres) {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS datasets (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255) NOT NULL,
          file_size BIGINT DEFAULT 0,
          row_count INTEGER DEFAULT 0,
          column_count INTEGER DEFAULT 0,
          missing_cells_count INTEGER DEFAULT 0,
          missing_percentage REAL DEFAULT 0,
          duplicate_rows_count INTEGER DEFAULT 0,
          raw_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dataset_columns (
          id VARCHAR(64) PRIMARY KEY,
          dataset_id VARCHAR(64) REFERENCES datasets(id) ON DELETE CASCADE,
          column_name VARCHAR(255) NOT NULL,
          data_type VARCHAR(64) NOT NULL,
          missing_count INTEGER DEFAULT 0,
          unique_count INTEGER DEFAULT 0,
          stats TEXT,
          order_index INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS analysis_results (
          id VARCHAR(64) PRIMARY KEY,
          dataset_id VARCHAR(64) REFERENCES datasets(id) ON DELETE CASCADE,
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          kpis TEXT,
          charts_config TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS datasets (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          row_count INTEGER DEFAULT 0,
          column_count INTEGER DEFAULT 0,
          missing_cells_count INTEGER DEFAULT 0,
          missing_percentage REAL DEFAULT 0,
          duplicate_rows_count INTEGER DEFAULT 0,
          raw_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS dataset_columns (
          id TEXT PRIMARY KEY,
          dataset_id TEXT,
          column_name TEXT NOT NULL,
          data_type TEXT NOT NULL,
          missing_count INTEGER DEFAULT 0,
          unique_count INTEGER DEFAULT 0,
          stats TEXT,
          order_index INTEGER DEFAULT 0,
          FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS analysis_results (
          id TEXT PRIMARY KEY,
          dataset_id TEXT,
          user_id TEXT,
          kpis TEXT,
          charts_config TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    }

    // Seed default accounts if not exists
    const bcrypt = require('bcryptjs');
    const seedUsers = [
      { id: 'demo-user-id', name: 'Demo Analyst', email: 'demo@datalens.local', pass: 'demopass123' },
      { id: 'admin-user-id', name: 'Administrator', email: 'admin@datalens.local', pass: 'admin123' },
      { id: 'varun-user-id', name: 'Varun Gupta', email: 'varun@datalens.local', pass: 'varun123' },
      { id: 'analyst-user-id', name: 'Data Scientist', email: 'analyst@datalens.local', pass: 'analyst123' }
    ];

    for (const u of seedUsers) {
      const existing = await query('SELECT * FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        const passHash = await bcrypt.hash(u.pass, 10);
        await query(
          'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
          [u.id, u.name, u.email, passHash]
        );
        console.log(`[Database] Seeded user: ${u.email} (${u.name})`);
      }
    }

    console.log('[Database] Schema verified and initialized successfully.');
  } catch (err) {
    console.error('[Database] Migration error:', err);
  }
};

module.exports = {
  query,
  initDatabase,
  isPostgres: () => isPostgres
};
