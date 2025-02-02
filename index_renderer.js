const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  const userId = checkAuth();
  if (userId) {
    loadProject();
    checkIfAdmin();
  }
});

function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

function loadProject() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  ipcRenderer.send("get-project", { userId });
}

// Check if user is admin and show User List button
function checkIfAdmin() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  ipcRenderer.send("check-admin", { userId });
}

ipcRenderer.on("project-data", (event, project) => {
  const detailsDiv = document.getElementById("projectDetails");
  if (project) {
    detailsDiv.innerHTML = `
            <p><span class="label">Nama Proyek:</span> ${project.name}</p>
            <p><span class="label">Lokasi:</span> ${project.location}</p>
            <p><span class="label">Tanggal:</span> ${new Date(
              project.created_at
            ).toLocaleDateString()}</p>
        `;
  } else {
    detailsDiv.innerHTML = `
            <p>Belum ada proyek. Silakan buat proyek baru di menu Data Proyek.</p>
        `;
  }
});

// Handle admin check response
ipcRenderer.on("admin-check-result", (event, isAdmin) => {
  const menuGrid = document.querySelector(".menu-grid");
  if (isAdmin) {
    // Add User List menu card for admin
    const userListCard = document.createElement("div");
    userListCard.className = "menu-card";
    userListCard.onclick = () => (window.location.href = "userList.html");
    userListCard.innerHTML = `
            <div class="icon-container">
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
            </div>
            <h3 class="menu-title">User List</h3>
            <p class="menu-description">Kelola daftar pengguna sistem</p>
        `;

    // Insert after Data Proyek menu
    const dataProyekCard = document.querySelector(".menu-card:nth-child(5)");
    if (dataProyekCard) {
      dataProyekCard.parentNode.insertBefore(
        userListCard,
        dataProyekCard.nextSibling
      );
    } else {
      menuGrid.appendChild(userListCard);
    }
  }
});

function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}
