const { ipcRenderer } = require("electron");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadMaterials();
});

// Load materials from the database
function loadMaterials() {
  ipcRenderer.send("get-materials");
}

// Handle materials data received from main process
ipcRenderer.on("materials-data", (event, materials) => {
  const tableBody = document.getElementById("materialTableBody");
  tableBody.innerHTML = "";

  materials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.unit}</td>
            <td>Rp ${material.price.toLocaleString()}</td>
            <td>${material.category || "-"}</td>
            <td>${new Date(material.created_at).toLocaleDateString()}</td>
            <td>
                <button onclick="editMaterial(${material.id})">Edit</button>
                <button onclick="deleteMaterial(${material.id})">Hapus</button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  document.getElementById("materialCount").textContent = materials.length;
});

// Search functionality
function searchMaterial() {
  const searchTerm = document.getElementById("searchInput").value;
  ipcRenderer.send("search-materials", searchTerm);
}

// Add new material
function addNewMaterial() {
  // TODO: Implement add new material dialog
  console.log("Adding new material...");
}

// Edit material
function editMaterial(id) {
  // TODO: Implement edit material dialog
  console.log("Editing material:", id);
}

// Delete material
function deleteMaterial(id) {
  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-material", id);
  }
}

// Handle successful deletion
ipcRenderer.on("material-deleted", () => {
  loadMaterials(); // Reload the materials list
});

// Logout/Exit function
function logout() {
  window.location.href = "index.html";
}
