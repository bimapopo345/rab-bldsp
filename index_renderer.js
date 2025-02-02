const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  // Check if user is admin
  ipcRenderer.send("check-admin", { userId });

  // Load project information
  loadProjectInfo(userId);

  // Add export/import buttons for non-admin users
  ipcRenderer.on("admin-check-result", (event, isAdmin) => {
    if (!isAdmin) {
      // Add user export/import buttons
      const container = document.querySelector(".container");
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "user-data-actions";
      actionsDiv.style.cssText =
        "margin-bottom: 20px; display: flex; gap: 10px;";

      const exportBtn = document.createElement("button");
      exportBtn.textContent = "Export Data Saya";
      exportBtn.className = "action-btn";
      exportBtn.onclick = exportMyData;

      const importBtn = document.createElement("button");
      importBtn.textContent = "Import Data";
      importBtn.className = "action-btn";
      importBtn.onclick = importMyData;

      actionsDiv.appendChild(exportBtn);
      actionsDiv.appendChild(importBtn);

      // Insert before first element in container
      container.insertBefore(actionsDiv, container.firstChild);

      // Add styles for buttons
      const style = document.createElement("style");
      style.textContent = `
        .action-btn {
          background-color: #1a4f7c;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .action-btn:hover {
          background-color: #16426a;
        }
      `;
      document.head.appendChild(style);
    }
  });
});

function loadProjectInfo(userId) {
  ipcRenderer.send("get-project", { userId });
}

// Handle project data response
ipcRenderer.on("project-data", (event, project) => {
  const projectDetails = document.getElementById("projectDetails");
  if (projectDetails) {
    if (project) {
      projectDetails.innerHTML = `
        <p><span class="label">Nama Proyek:</span> ${project.name || "-"}</p>
        <p><span class="label">Lokasi:</span> ${project.location || "-"}</p>
      `;
    } else {
      projectDetails.innerHTML = `
        <p>Belum ada data proyek. Silakan buat proyek baru di menu Data Proyek.</p>
      `;
    }
  }
});

async function exportMyData() {
  const userId = localStorage.getItem("userId");
  try {
    const result = await ipcRenderer.invoke("export-my-data", userId);
    alert(result.message);
  } catch (error) {
    alert("Error mengekspor data: " + error.message);
  }
}

async function importMyData() {
  const userId = localStorage.getItem("userId");
  if (
    confirm(
      "Import akan mengganti semua data Anda yang ada. Apakah Anda yakin ingin melanjutkan?"
    )
  ) {
    try {
      const result = await ipcRenderer.invoke("import-my-data", userId);
      alert(result.message);
      if (result.success) {
        window.location.reload();
      }
    } catch (error) {
      alert("Error mengimpor data: " + error.message);
    }
  }
}

function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
