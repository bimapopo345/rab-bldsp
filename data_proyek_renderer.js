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
    loadProject();
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

// Load current project if it exists
function loadProject() {
  try {
    const stmt = db.prepare(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 1"
    );
    const project = stmt.get();
    if (project) {
      // Fill form with existing project data
      document.getElementById("projectName").value = project.name;
      document.getElementById("projectLocation").value = project.location;
      displayProject(project);
    }
  } catch (err) {
    console.error("Error loading project:", err);
  }
}

// Display project in the UI
function displayProject(project) {
  const projectList = document.getElementById("projectList");
  projectList.innerHTML = "";

  if (project) {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";
    projectItem.innerHTML = `
            <h3>${project.name}</h3>
            <p>Lokasi: ${project.location}</p>
        `;
    projectList.appendChild(projectItem);
  }
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
    // Check if project exists
    const existingProject = db
      .prepare("SELECT * FROM projects ORDER BY created_at DESC LIMIT 1")
      .get();

    if (existingProject) {
      // Update existing project
      const stmt = db.prepare(
        "UPDATE projects SET name = ?, location = ? WHERE id = ?"
      );
      const result = stmt.run(projectName, projectLocation, existingProject.id);

      if (result.changes > 0) {
        alert("Data proyek berhasil diperbarui");
        loadProject(); // Reload project data
      } else {
        alert("Terjadi kesalahan saat memperbarui data proyek");
      }
    } else {
      // Create new project if none exists
      const stmt = db.prepare(
        "INSERT INTO projects (name, location) VALUES (?, ?)"
      );
      const result = stmt.run(projectName, projectLocation);

      if (result.changes > 0) {
        alert("Data proyek berhasil disimpan");
        loadProject(); // Reload project data
      } else {
        alert("Terjadi kesalahan saat menyimpan data proyek");
      }
    }
  } catch (err) {
    console.error("Error saving project:", err);
    alert("Terjadi kesalahan saat menyimpan/memperbarui data proyek");
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
