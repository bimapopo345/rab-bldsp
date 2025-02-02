const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let mainWindow;
let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database("database.sqlite", (err) => {
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
        resolve();
      });
    });
  });
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

  initDatabase().catch(console.error);

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
  db.get(
    "SELECT * FROM admin WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (err) {
        console.error("Login error:", err);
        event.reply("login-result", "failure");
        return;
      }
      event.reply("login-result", user ? "success" : "failure");
    }
  );
});

// Get all materials
ipcMain.on("get-materials", (event) => {
  db.all("SELECT * FROM materials", (err, materials) => {
    if (err) {
      console.error("Error fetching materials:", err);
      event.reply("materials-data", []);
      return;
    }
    event.reply("materials-data", materials);
  });
});

// Search materials
ipcMain.on("search-materials", (event, searchTerm) => {
  const query = `%${searchTerm}%`;
  db.all(
    "SELECT * FROM materials WHERE name LIKE ? OR category LIKE ?",
    [query, query],
    (err, materials) => {
      if (err) {
        console.error("Error searching materials:", err);
        event.reply("materials-data", []);
        return;
      }
      event.reply("materials-data", materials);
    }
  );
});

// Add new material
ipcMain.on("add-material", (event, material) => {
  db.run(
    "INSERT INTO materials (name, unit, price, category) VALUES (?, ?, ?, ?)",
    [material.name, material.unit, material.price, material.category],
    (err) => {
      if (err) {
        console.error("Error adding material:", err);
        event.reply("material-added", { error: err.message });
        return;
      }
      event.reply("material-added");
    }
  );
});

// Delete material
ipcMain.on("delete-material", (event, id) => {
  db.run("DELETE FROM materials WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Error deleting material:", err);
      event.reply("material-deleted", { error: err.message });
      return;
    }
    event.reply("material-deleted");
    event.reply("focus-search");
  });
});

// Get material by ID
ipcMain.on("get-material-by-id", (event, id) => {
  db.get("SELECT * FROM materials WHERE id = ?", [id], (err, material) => {
    if (err) {
      console.error("Error fetching material:", err);
      event.reply("material-data", {});
      return;
    }
    event.reply("material-data", material);
  });
});

// Update material
ipcMain.on("update-material", (event, { id, name, unit, price, category }) => {
  db.run(
    "UPDATE materials SET name = ?, unit = ?, price = ?, category = ? WHERE id = ?",
    [name, unit, price, category, id],
    (err) => {
      if (err) {
        console.error("Error updating material:", err);
        event.reply("material-updated", { error: err.message });
        return;
      }
      event.reply("material-updated", { success: true });
    }
  );
});

// Get all AHS
ipcMain.on("get-ahs", (event) => {
  db.all("SELECT * FROM ahs", (err, ahs) => {
    if (err) {
      console.error("Error fetching AHS:", err);
      event.reply("ahs-data", []);
      return;
    }
    event.reply("ahs-data", ahs);
  });
});

// Get AHS by ID
ipcMain.on("get-ahs-by-id", (event, id) => {
  db.get("SELECT * FROM ahs WHERE id = ?", [id], (err, ahs) => {
    if (err) {
      console.error("Error fetching AHS by ID:", err);
      event.reply("ahs-data-for-edit", null);
      return;
    }
    event.reply("ahs-data-for-edit", ahs);
  });
});

// Add AHS
ipcMain.on("add-ahs", (event, ahsData) => {
  db.run(
    "INSERT INTO ahs (kelompok, kode_ahs, ahs, satuan) VALUES (?, ?, ?, ?)",
    [ahsData.kelompok, ahsData.kode_ahs, ahsData.ahs, ahsData.satuan],
    (err) => {
      if (err) {
        console.error("Error adding AHS:", err);
        event.reply("ahs-added", { error: err.message });
        return;
      }
      event.reply("ahs-added");
    }
  );
});

// Update AHS
ipcMain.on("update-ahs", (event, ahsData) => {
  db.run(
    "UPDATE ahs SET kelompok = ?, kode_ahs = ?, ahs = ?, satuan = ? WHERE id = ?",
    [
      ahsData.kelompok,
      ahsData.kode_ahs,
      ahsData.ahs,
      ahsData.satuan,
      ahsData.id,
    ],
    (err) => {
      if (err) {
        console.error("Error updating AHS:", err);
        event.reply("ahs-updated", { error: err.message });
        return;
      }
      event.reply("ahs-updated");
    }
  );
});

// Delete AHS
ipcMain.on("delete-ahs", (event, id) => {
  db.run("DELETE FROM ahs WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Error deleting AHS:", err);
      event.reply("ahs-deleted", { error: err.message });
      return;
    }
    event.reply("ahs-deleted");
  });
});

// Search AHS
ipcMain.on("search-ahs", (event, searchTerm) => {
  const query = "%" + searchTerm + "%";
  db.all(
    "SELECT * FROM ahs WHERE kelompok LIKE ? OR ahs LIKE ?",
    [query, query],
    (err, results) => {
      if (err) {
        console.error("Error searching AHS:", err);
        event.reply("ahs-data", []);
        return;
      }
      event.reply("ahs-data", results);
    }
  );
});

// Add pricing
ipcMain.on(
  "add-pricing",
  (event, { ahs_id, material_id, quantity, koefisien }) => {
    db.run(
      "INSERT INTO pricing (ahs_id, material_id, quantity, koefisien) VALUES (?, ?, ?, ?)",
      [ahs_id, material_id, quantity, koefisien],
      function (err) {
        if (err) {
          console.error("Error adding pricing:", err);
          event.reply("pricing-added", { error: err.message });
          return;
        }
        event.reply("pricing-added");
      }
    );
  }
);

// Get pricing
ipcMain.on("get-pricing", (event, ahs_id) => {
  db.all(
    `SELECT p.*, m.name, m.unit, m.price 
     FROM pricing p
     JOIN materials m ON p.material_id = m.id
     WHERE p.ahs_id = ?`,
    [ahs_id],
    (err, pricing) => {
      if (err) {
        console.error("Error fetching pricing:", err);
        event.reply("pricing-data", []);
        return;
      }
      event.reply("pricing-data", pricing);
    }
  );
});

// Delete pricing
ipcMain.on("delete-pricing", (event, pricingId) => {
  // First get the AHS ID
  db.get(
    "SELECT ahs_id FROM pricing WHERE id = ?",
    [pricingId],
    (err, pricing) => {
      if (err || !pricing) {
        console.error("Error finding pricing:", err);
        event.reply("pricing-deleted", {
          error: err ? err.message : "Pricing not found",
        });
        return;
      }

      const ahs_id = parseInt(pricing.ahs_id, 10);

      // Delete the pricing entry
      db.run("DELETE FROM pricing WHERE id = ?", [pricingId], (err) => {
        if (err) {
          console.error("Error deleting pricing:", err);
          event.reply("pricing-deleted", { error: err.message });
          return;
        }

        // Get updated pricing data
        db.all(
          `SELECT p.*, m.name, m.unit, m.price
         FROM pricing p
         JOIN materials m ON p.material_id = m.id
         WHERE p.ahs_id = ?`,
          [ahs_id],
          (err, updatedPricing) => {
            if (err) {
              console.error("Error fetching updated pricing:", err);
              event.reply("pricing-data", []);
              return;
            }
            event.reply("pricing-data", updatedPricing);
            event.reply("pricing-deleted");
          }
        );
      });
    }
  );
});

// Update pricing
ipcMain.on("update-pricing", (event, { pricing_id, ahs_id, koefisien }) => {
  db.run(
    "UPDATE pricing SET koefisien = ? WHERE id = ?",
    [koefisien, pricing_id],
    (err) => {
      if (err) {
        console.error("Error updating pricing:", err);
        event.reply("pricing-updated", { error: err.message });
        return;
      }

      // Get updated pricing data
      db.all(
        `SELECT p.*, m.name, m.unit, m.price
         FROM pricing p
         JOIN materials m ON p.material_id = m.id
         WHERE p.ahs_id = ?`,
        [ahs_id],
        (err, updatedPricing) => {
          if (err) {
            console.error("Error fetching updated pricing:", err);
            event.reply("pricing-data", []);
            return;
          }
          event.reply("pricing-data", updatedPricing);
          event.reply("pricing-updated");
        }
      );
    }
  );
});

// Sort materials
ipcMain.on("sort-materials", (event, { column, direction }) => {
  const query = `SELECT * FROM materials ORDER BY ${column} ${
    direction === "asc" ? "ASC" : "DESC"
  }`;
  db.all(query, [], (err, materials) => {
    if (err) {
      console.error("Error sorting materials:", err);
      event.reply("sorted-materials", []);
      return;
    }
    event.reply("sorted-materials", materials);
  });
});

// Sort AHS
ipcMain.on("sort-ahs", (event, { column, direction }) => {
  const query = `SELECT * FROM ahs ORDER BY ${column} ${
    direction === "asc" ? "ASC" : "DESC"
  }`;
  db.all(query, [], (err, ahs) => {
    if (err) {
      console.error("Error sorting AHS:", err);
      event.reply("sorted-ahs", []);
      return;
    }
    event.reply("sorted-ahs", ahs);
  });
});
