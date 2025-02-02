const { ipcRenderer } = require("electron");

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

// Request latest project data from main process
function loadLatestProject() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-project", { userId });
  // Show loading state
  const projectDetails = document.getElementById("projectDetails");
  projectDetails.innerHTML = `
    <p><span class="label">Nama Proyek:</span> <span>Loading...</span></p>
    <p><span class="label">Lokasi:</span> <span>Loading...</span></p>
  `;
}

// Display project information
function displayProjectInfo(project) {
  const projectDetails = document.getElementById("projectDetails");

  if (project) {
    projectDetails.innerHTML = `
      <p><span class="label">Nama Proyek:</span> <span>${
        project.name || ""
      }</span></p>
      <p><span class="label">Lokasi:</span> <span>${
        project.location || ""
      }</span></p>
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

// Handle project data response
ipcRenderer.on("project-data", (event, project) => {
  if (!project) {
    displayNoProject();
    return;
  }
  displayProjectInfo(project);
});

// Ensure user is authenticated when page loads
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadLatestProject();
});

// Logout function
function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
