const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const db = new Database("database.sqlite", { verbose: console.log });

// Create tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const existingAdmin = db.prepare("SELECT COUNT(*) AS count FROM admin").get();
  if (existingAdmin.count === 0) {
    db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run(
      "admin",
      "admin123"
    );
  }

  // Menghapus tabel yang tidak dibutuhkan
  db.exec("DROP TABLE IF EXISTS projects;");
  db.exec("DROP TABLE IF EXISTS cost_estimates;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create AHS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ahs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kelompok TEXT NOT NULL,
      kode_ahs TEXT NOT NULL,
      ahs TEXT NOT NULL,
      satuan TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Database initialized successfully!");
}

// Run initialization
try {
  initializeDatabase();
} catch (err) {
  console.error("Error initializing database:", err);
}

// Close database connection
db.close();
