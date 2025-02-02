const { ipcRenderer } = require("electron");

// Load project info when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadProjectInfo();
  setupBackButton();
});

// Setup back button
function setupBackButton() {
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
}

// Load project information
function loadProjectInfo() {
  ipcRenderer.send("get-project");
}

// Handle project data
ipcRenderer.on("project-data", (event, project) => {
  document.getElementById("projectName").textContent = project
    ? project.name
    : "Belum ada proyek";
  document.getElementById("projectLocation").textContent = project
    ? project.location
    : "Belum ada lokasi";
});

// Show loading indicator
function showLoading() {
  const loading = document.getElementById("loadingIndicator");
  loading.classList.add("active");
}

// Hide loading indicator
function hideLoading() {
  const loading = document.getElementById("loadingIndicator");
  loading.classList.remove("active");
}

// Print all RAB data
function printAll() {
  showLoading();
  ipcRenderer.send("print-rab", "all");
}

// Print wages only
function printWages() {
  showLoading();
  ipcRenderer.send("print-rab", "wages");
}

// Print materials only
function printMaterials() {
  showLoading();
  ipcRenderer.send("print-rab", "materials");
}

// Print AHS only
function printAhsOnly() {
  showLoading();
  ipcRenderer.send("print-rab", "ahs");
}

// Handle print completion
ipcRenderer.on("print-complete", (event, result) => {
  hideLoading();
  if (result.success) {
    alert("File Excel berhasil dibuat!\nLokasi: " + result.path);
  } else {
    alert("Error membuat file Excel: " + result.error);
  }
});

// Handle print error
ipcRenderer.on("print-error", (event, error) => {
  hideLoading();
  alert("Terjadi kesalahan: " + error);
});
