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
    loadLatestProject();
  } catch (err) {
    console.error("Error connecting to database:", err);
    displayNoProject();
  }
}

// Load the latest project
function loadLatestProject() {
  try {
    const stmt = db.prepare(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 1"
    );
    const project = stmt.get();
    displayProjectInfo(project);
  } catch (err) {
    console.error("Error loading project:", err);
    displayNoProject();
  }
}

// Display project information
function displayProjectInfo(project) {
  const projectDetails = document.getElementById("projectDetails");

  if (project) {
    projectDetails.innerHTML = `
            <p><span class="label">Nama Proyek:</span> ${project.name}</p>
            <p><span class="label">Lokasi:</span> ${project.location}</p>
        `;
  } else {
    displayNoProject();
  }
}

// Display message when no project exists
function displayNoProject() {
  const projectDetails = document.getElementById("projectDetails");
  projectDetails.innerHTML = `
        <p>Belum ada proyek yang dibuat. Silakan buat proyek baru di menu Data Proyek.</p>
    `;
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
