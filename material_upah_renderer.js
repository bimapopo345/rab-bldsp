const { ipcRenderer } = require("electron");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadMaterials();
  initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
  // Search input handler
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", searchMaterial);
  }

  // Modal close handlers
  const modal = document.getElementById("addMaterialModal");
  const modalContent = modal.querySelector(".modal-content");

  // Close modal when clicking outside
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Prevent modal from closing when clicking inside
  modalContent.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  // Form submission prevention
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      event.target.tagName.toLowerCase() !== "textarea"
    ) {
      event.preventDefault();
    }
  });
}

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

  // Ensure search input is enabled and focused
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
  }
});

// Search functionality with debounce
let searchTimeout;
function searchMaterial(event) {
  const searchInput = event.target;
  clearTimeout(searchTimeout);

  // Ensure input is enabled
  searchInput.disabled = false;

  searchTimeout = setTimeout(() => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm === "") {
      loadMaterials(); // Load all materials if search is empty
    } else {
      ipcReader.send("search-materials", searchTerm);
    }
  }, 300); // Wait 300ms after user stops typing
}

// Modal handling
function addNewMaterial() {
  const modal = document.getElementById("addMaterialModal");

  // Clear and enable form fields
  const inputs = modal.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.value = "";
    input.disabled = false;
  });

  // Set default category
  document.getElementById("newCategory").value = "Material";

  modal.style.display = "block";
}

function closeModal() {
  const modal = document.getElementById("addMaterialModal");
  modal.style.display = "none";
}

function saveMaterial() {
  const name = document.getElementById("newName").value.trim();
  const unit = document.getElementById("newUnit").value.trim();
  const price = document.getElementById("newPrice").value;
  const category = document.getElementById("newCategory").value;

  if (!name || !unit || !price) {
    alert("Semua field harus diisi!");
    return;
  }

  ipcRenderer.send("add-material", {
    name,
    unit,
    price: parseFloat(price),
    category,
  });

  closeModal();
}

// Handle material added successfully
ipcRenderer.on("material-added", () => {
  loadMaterials(); // Reload the materials list
});

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

  // Re-enable and focus search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
  }
});

// Logout/Exit function
function logout() {
  window.location.href = "index.html";
}
