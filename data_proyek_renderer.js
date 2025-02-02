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
    createProjectTable();
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

// Create projects table if it doesn't exist
function createProjectTable() {
  try {
    db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    loadProjects();
  } catch (err) {
    console.error("Error creating projects table:", err);
  }
}

// Load all projects
function loadProjects() {
  try {
    const stmt = db.prepare("SELECT * FROM projects ORDER BY created_at DESC");
    const projects = stmt.all();
    displayProjects(projects);
  } catch (err) {
    console.error("Error loading projects:", err);
  }
}

// Display projects in the UI
function displayProjects(projects) {
  const projectList = document.getElementById("projectList");
  projectList.innerHTML = "";

  projects.forEach((project) => {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";
    projectItem.innerHTML = `
            <h3>${project.name}</h3>
            <p>Lokasi: ${project.location}</p>
        `;
    projectList.appendChild(projectItem);
  });
}

// Form submission handler
document.getElementById("projectForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const projectName = document.getElementById("projectName").value.trim();
  const projectLocation = document
    .getElementById("projectLocation")
    .value.trim();

  if (!projectName || !projectLocation) {
    alert("Mohon isi semua field yang diperlukan");
    return;
  }

  try {
    const stmt = db.prepare(
      "INSERT INTO projects (name, location) VALUES (?, ?)"
    );
    const result = stmt.run(projectName, projectLocation);

    if (result.changes > 0) {
      alert("Data proyek berhasil disimpan");
      document.getElementById("projectForm").reset();
      loadProjects();
    } else {
      alert("Terjadi kesalahan saat menyimpan data proyek");
    }
  } catch (err) {
    console.error("Error saving project:", err);
    alert("Terjadi kesalahan saat menyimpan data proyek");
  }
});

// Initialize the database connection when the page loads
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
