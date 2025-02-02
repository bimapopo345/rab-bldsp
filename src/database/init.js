const sqlite3 = require("sqlite3").verbose();

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database("database.sqlite", (err) => {
      if (err) {
        console.error("Database opening error:", err);
        reject(err);
        return;
      }

      db.serialize(() => {
        // Create materials table
        db.run(`
          CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create AHS table
        db.run(`
          CREATE TABLE IF NOT EXISTS ahs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kelompok TEXT NOT NULL,
            kode_ahs TEXT NOT NULL,
            ahs TEXT NOT NULL,
            satuan TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create admin table
        db.run(`
          CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create pricing table
        db.run(`
          CREATE TABLE IF NOT EXISTS pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ahs_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            koefisien REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ahs_id) REFERENCES ahs(id),
            FOREIGN KEY (material_id) REFERENCES materials(id)
          )
        `);

        // Create projects table
        db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check if admin exists and create default if not
        db.get(
          "SELECT * FROM admin WHERE username = ?",
          ["admin"],
          (err, row) => {
            if (err) {
              console.error("Error checking admin:", err);
              return;
            }
            if (!row) {
              db.run("INSERT INTO admin (username, password) VALUES (?, ?)", [
                "admin",
                "admin",
              ]);
            }
          }
        );

        console.log("Database initialized successfully!");
        resolve(db);
      });
    });
  });
}

module.exports = { initDatabase };
