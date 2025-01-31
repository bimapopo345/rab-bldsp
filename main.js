const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

let mainWindow;
let db;

function initDatabase() {
  try {
    db = new Database("database.sqlite", { verbose: console.log });

    // Create tables if they don't exist
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

    // Drop and recreate materials table to add category column
    db.exec(`DROP TABLE IF EXISTS materials`);

    db.exec(`
            CREATE TABLE materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                unit TEXT NOT NULL,
                price REAL NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
            CREATE TABLE IF NOT EXISTS admin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Insert default admin user if it doesn't exist
    const adminExists = db
      .prepare("SELECT * FROM admin WHERE username = ?")
      .get("admin");
    if (!adminExists) {
      db.prepare("INSERT INTO admin (username, password) VALUES (?, ?)").run(
        "admin",
        "admin"
      );
    }

    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("login.html");
  initDatabase();

  // Handle window close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Handle app ready
app.whenReady().then(createWindow);

// Handle all windows closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      try {
        db.close();
      } catch (err) {
        console.error("Error closing database:", err);
      }
    }
    app.quit();
  }
});

// Handle app activation
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle process termination
process.on("SIGINT", () => {
  if (db) {
    try {
      db.close();
    } catch (err) {
      console.error("Error closing database:", err);
    }
  }
  app.quit();
});

// Login handler
ipcMain.on("login", (event, { username, password }) => {
  try {
    const user = db
      .prepare("SELECT * FROM admin WHERE username = ? AND password = ?")
      .get(username, password);

    if (user) {
      event.reply("login-result", "success");
    } else {
      event.reply("login-result", "failure");
    }
  } catch (err) {
    console.error("Login error:", err);
    event.reply("login-result", "failure");
  }
});

// Get all materials
ipcMain.on("get-materials", (event) => {
  try {
    const materials = db
      .prepare("SELECT * FROM materials ORDER BY created_at DESC")
      .all();
    event.reply("materials-data", materials);
  } catch (err) {
    console.error("Error fetching materials:", err);
    event.reply("materials-data", []);
  }
});

// Search materials
ipcMain.on("search-materials", (event, searchTerm) => {
  try {
    const materials = db
      .prepare("SELECT * FROM materials WHERE name LIKE ? OR category LIKE ?")
      .all(`%${searchTerm}%`, `%${searchTerm}%`);
    event.reply("materials-data", materials);
  } catch (err) {
    console.error("Error searching materials:", err);
    event.reply("materials-data", []);
  }
});

// Add new material
ipcMain.on("add-material", (event, material) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO materials (name, unit, price, category) VALUES (?, ?, ?, ?)"
    );
    stmt.run(material.name, material.unit, material.price, material.category);
    event.reply("material-added");
  } catch (err) {
    console.error("Error adding material:", err);
    event.reply("material-added", { error: err.message });
  }
});

// Delete material
ipcMain.on("delete-material", (event, id) => {
  try {
    db.prepare("DELETE FROM materials WHERE id = ?").run(id);
    event.reply("material-deleted");
  } catch (err) {
    console.error("Error deleting material:", err);
    event.reply("material-deleted", { error: err.message });
  }
});
