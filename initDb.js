const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const db = new Database("database.sqlite", { verbose: console.log });

// Create tables
function initializeDatabase() {
  // Menghapus tabel yang tidak diperlukan
  db.exec("DROP TABLE IF EXISTS projects;");
  db.exec("DROP TABLE IF EXISTS cost_estimates;");

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

  // Periksa apakah tabel AHS sudah ada
  const ahsTableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ahs';"
    )
    .get();
  if (ahsTableExists) {
    console.log("Tabel AHS berhasil dibuat.");
  } else {
    console.log("Tabel AHS tidak ditemukan!");
  }

  // Create admin table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Menambahkan admin default jika belum ada
  const existingAdmin = db.prepare("SELECT COUNT(*) AS count FROM admin").get();
  if (existingAdmin.count === 0) {
    db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run(
      "admin",
      "admin123"
    );
  }

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
