const { ipcRenderer } = require("electron");

// Request latest project data from main process
function loadLatestProject() {
  ipcRenderer.send("get-project");
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

// Load data when page loads
loadLatestProject();

// Logout function
function logout() {
  window.location.href = "login.html";
}
