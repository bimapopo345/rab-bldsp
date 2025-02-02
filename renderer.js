const { ipcRenderer } = require("electron");
const Database = require("better-sqlite3");
const path = require("path");

let db;

// Initialize database connection
function initializeDB() {
  const dbPath = path.join(__dirname, "database.sqlite");
  try {
    db = new Database(dbPath, { verbose: console.log });
    console.log("Connected to database");
  } catch (err) {
    console.error("Error connecting to database:", err);
    showError("Database connection error");
  }
}

// Login attempt handler
function attemptLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("Username dan password harus diisi");
    return;
  }

  try {
    const stmt = db.prepare(
      "SELECT * FROM admin WHERE username = ? AND password = ?"
    );
    const user = stmt.get(username, password);

    if (user) {
      showSuccess("Login berhasil");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    } else {
      showError("Username atau password salah");
    }
  } catch (err) {
    console.error("Login error:", err);
    showError("Terjadi kesalahan saat login");
  }
}

// Initialize when page loads
initializeDB();

// Clean up database connection when window is closed
window.addEventListener("unload", () => {
  if (db) {
    try {
      db.close();
    } catch (err) {
      console.error("Error closing database:", err);
    }
  }
});
