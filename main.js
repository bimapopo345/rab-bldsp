const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

let mainWindow;
let db;

function initDatabase() {
  try {
    db = new Database("database.sqlite", { verbose: console.log });

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

  // Workaround for focus issue on Windows
  const isWindows = process.platform === "win32";
  let needsFocusFix = false;
  let triggeringProgrammaticBlur = false;

  mainWindow.on("blur", (event) => {
    if (!triggeringProgrammaticBlur) {
      needsFocusFix = true;
    }
  });

  mainWindow.on("focus", (event) => {
    if (isWindows && needsFocusFix) {
      needsFocusFix = false;
      triggeringProgrammaticBlur = true;
      setTimeout(function () {
        mainWindow.blur();
        mainWindow.focus();
        setTimeout(function () {
          triggeringProgrammaticBlur = false;
        }, 100);
      }, 100);
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
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
    // Tell renderer to focus search input
    event.reply("focus-search");
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
    // Tell renderer to focus search input
    event.reply("focus-search");
  } catch (err) {
    console.error("Error deleting material:", err);
    event.reply("material-deleted", { error: err.message });
  }
});

// Mendapatkan material berdasarkan id
ipcMain.on("get-material-by-id", (event, id) => {
  try {
    const material = db.prepare("SELECT * FROM materials WHERE id = ?").get(id);
    event.reply("material-data", material);
  } catch (err) {
    console.error("Error fetching material:", err);
    event.reply("material-data", {});
  }
});

// Mengupdate data material
ipcMain.on("update-material", (event, { id, name, unit, price, category }) => {
  try {
    db.prepare(
      "UPDATE materials SET name = ?, unit = ?, price = ?, category = ? WHERE id = ?"
    ).run(name, unit, price, category, id);
    event.reply("material-updated", { success: true });
  } catch (err) {
    console.error("Error updating material:", err);
    event.reply("material-updated", { error: err.message });
  }
});

// Get all AHS
ipcMain.on("get-ahs", (event) => {
  try {
    const ahs = db.prepare("SELECT * FROM ahs ORDER BY kode_ahs ASC").all();
    event.reply("ahs-data", ahs);
  } catch (err) {
    console.error("Error fetching AHS:", err);
    event.reply("ahs-data", []);
  }
});

// Search AHS
ipcMain.on("search-ahs", (event, searchTerm) => {
  try {
    const ahs = db
      .prepare("SELECT * FROM ahs WHERE ahs LIKE ? OR kode_ahs LIKE ?")
      .all(`%${searchTerm}%`, `%${searchTerm}%`);
    event.reply("ahs-data", ahs);
  } catch (err) {
    console.error("Error searching AHS:", err);
    event.reply("ahs-data", []);
  }
});

// Get AHS by ID
ipcMain.on("get-ahs-by-id", (event, id) => {
  try {
    const ahs = db.prepare("SELECT * FROM ahs WHERE id = ?").get(id);
    event.reply("ahs-data", ahs);
  } catch (err) {
    console.error("Error fetching AHS by ID:", err);
    event.reply("ahs-data", {});
  }
});

// Delete AHS
ipcMain.on("delete-ahs", (event, id) => {
  try {
    db.prepare("DELETE FROM ahs WHERE id = ?").run(id);
    event.reply("ahs-deleted");
  } catch (err) {
    console.error("Error deleting AHS:", err);
    event.reply("ahs-deleted", { error: err.message });
  }
});
