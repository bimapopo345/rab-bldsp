const { app, BrowserWindow } = require("electron");
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

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  if (db) {
    db.close();
  }
});
