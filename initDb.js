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

  // Menambahkan admin default jika belum ada
  const existingAdmin = db.prepare("SELECT COUNT(*) AS count FROM admin").get();
  if (existingAdmin.count === 0) {
    db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run(
      "admin",
      "admin123"
    );
  }
  // Projects table
  db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            start_date TEXT,
            end_date TEXT,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Materials table
  db.exec(`
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

  // Cost estimates table
  db.exec(`
        CREATE TABLE IF NOT EXISTS cost_estimates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            material_id INTEGER,
            quantity REAL NOT NULL,
            total_cost REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (material_id) REFERENCES materials (id)
        )
    `);
  db.exec(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        satuan TEXT NOT NULL,
        harga REAL NOT NULL,
        kategori TEXT NOT NULL,
        update TEXT NOT NULL
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
