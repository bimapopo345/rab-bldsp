const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

let mainWindow;
let db;

function initDatabase() {
  try {
    db = new Database("database.sqlite", { verbose: console.log });

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
      CREATE TABLE IF NOT EXISTS ahs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kelompok TEXT NOT NULL,
        kode_ahs TEXT NOT NULL,
        ahs TEXT NOT NULL,
        satuan TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pastikan kolom koefisien ada di dalam tabel pricing
    db.exec(`
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
// Fetch materials
ipcMain.on("get-materials", (event) => {
  try {
    const materials = db.prepare("SELECT * FROM materials").all();
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
// Fetch AHS
// Mendapatkan semua data AHS
ipcMain.on("get-ahs", (event) => {
  try {
    const ahs = db.prepare("SELECT * FROM ahs").all();
    event.reply("ahs-data", ahs); // Kirim data AHS ke renderer
  } catch (err) {
    console.error("Error fetching AHS:", err);
    event.reply("ahs-data", []); // Jika error, kirim array kosong
  }
});

// Get AHS by ID
// Get AHS data by ID for autofill
// Mendapatkan AHS berdasarkan ID
// Mendapatkan data AHS berdasarkan ID
ipcMain.on("get-ahs-by-id", (event, id) => {
  try {
    const ahs = db.prepare("SELECT * FROM ahs WHERE id = ?").get(id);
    event.reply("ahs-data-for-edit", ahs); // Kirim data AHS untuk editing
  } catch (err) {
    console.error("Error fetching AHS by ID:", err);
    event.reply("ahs-data-for-edit", null); // Jika error, kirim null
  }
});

// Add AHS
ipcMain.on("add-ahs", (event, ahsData) => {
  try {
    const stmt = db.prepare(
      "INSERT INTO ahs (kelompok, kode_ahs, ahs, satuan) VALUES (?, ?, ?, ?)"
    );
    stmt.run(ahsData.kelompok, ahsData.kode_ahs, ahsData.ahs, ahsData.satuan);
    event.reply("ahs-added");
  } catch (err) {
    console.error("Error adding AHS:", err);
    event.reply("ahs-added", { error: err.message });
  }
});

// Update AHS
ipcMain.on("update-ahs", (event, ahsData) => {
  try {
    const stmt = db.prepare(
      "UPDATE ahs SET kelompok = ?, kode_ahs = ?, ahs = ?, satuan = ? WHERE id = ?"
    );
    stmt.run(
      ahsData.kelompok,
      ahsData.kode_ahs,
      ahsData.ahs,
      ahsData.satuan,
      ahsData.id
    );
    event.reply("ahs-updated");
  } catch (err) {
    console.error("Error updating AHS:", err);
    event.reply("ahs-updated", { error: err.message });
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

// Add pricing calculation handlers
// Menambahkan pricing dengan koefisien
// Add pricing data to the database
ipcMain.on(
  "add-pricing",
  (event, { ahs_id, material_id, quantity, koefisien }) => {
    try {
      const stmt = db.prepare(
        "INSERT INTO pricing (ahs_id, material_id, quantity, koefisien) VALUES (?, ?, ?, ?)"
      );
      const result = stmt.run(ahs_id, material_id, quantity, koefisien);
      console.log("Inserted pricing:", result);
      event.reply("pricing-added");
    } catch (err) {
      console.error("Error adding pricing:", err);
      event.reply("pricing-added", { error: err.message });
    }
  }
);

ipcMain.on("get-pricing", (event, ahs_id) => {
  try {
    const pricing = db
      .prepare(
        `
      SELECT p.*, m.name, m.unit, m.price 
      FROM pricing p
      JOIN materials m ON p.material_id = m.id
      WHERE p.ahs_id = ?
    `
      )
      .all(ahs_id);
    event.reply("pricing-data", pricing);
  } catch (err) {
    console.error("Error fetching pricing:", err);
    event.reply("pricing-data", []);
  }
});

ipcMain.on("delete-pricing", (event, id) => {
  try {
    db.prepare("DELETE FROM pricing WHERE id = ?").run(id);
    event.reply("pricing-deleted");
  } catch (err) {
    console.error("Error deleting pricing:", err);
    event.reply("pricing-deleted", { error: err.message });
  }
});

// Handle search for AHS based on kelompok and ahs name
ipcMain.on("search-ahs", (event, searchTerm) => {
  try {
    const query = "%" + searchTerm + "%";
    const results = db
      .prepare("SELECT * FROM ahs WHERE kelompok LIKE ? OR ahs LIKE ?")
      .all(query, query);
    event.reply("ahs-data", results);
  } catch (err) {
    console.error("Error searching AHS:", err);
    event.reply("ahs-data", []);
  }
});

// Sorting Materials
ipcMain.on("sort-materials", (event, { column, direction }) => {
  try {
    const query = `SELECT * FROM materials ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;
    const materials = db.prepare(query).all();
    event.reply("sorted-materials", materials);
  } catch (err) {
    console.error("Error sorting materials:", err);
    event.reply("sorted-materials", []);
  }
});

// Sorting AHS
ipcMain.on("sort-ahs", (event, { column, direction }) => {
  try {
    const query = `SELECT * FROM ahs ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;
    const ahs = db.prepare(query).all();
    event.reply("sorted-ahs", ahs);
  } catch (err) {
    console.error("Error sorting AHS:", err);
    event.reply("sorted-ahs", []);
  }
});
