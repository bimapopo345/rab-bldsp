const { ipcRenderer } = require("electron");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadMaterials();
  initializeSearchInput();
});

// Initialize search input
function initializeSearchInput() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    // Add input event listener once
    if (!searchInput.hasAttribute("data-has-handler")) {
      searchInput.addEventListener("input", (event) => {
        const searchTerm = event.target.value.trim();
        if (searchTerm === "") {
          loadMaterials();
        } else {
          ipcRenderer.send("search-materials", searchTerm);
        }
      });
      searchInput.setAttribute("data-has-handler", "true");
    }
  }
}

// Load materials from the database
function loadMaterials() {
  ipcRenderer.send("get-materials");
}

// Focus handler from main process
ipcRenderer.on("focus-search", () => {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    // Place cursor at end of text
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }
});

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

// Modal handling
function addNewMaterial() {
  const modal = document.getElementById("addMaterialModal");

  // Clear form fields
  document.getElementById("newName").value = "";
  document.getElementById("newUnit").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newCategory").value = "Material";

  modal.style.display = "block";

  // Focus first input
  const nameInput = document.getElementById("newName");
  if (nameInput) {
    nameInput.focus();
  }
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
ipcRenderer.on("material-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadMaterials();
  }
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

    // Only reset search if input is not focused and modal is closed
    const searchInput = document.getElementById("searchInput");
    const modal = document.getElementById("addMaterialModal");

    if (
      searchInput &&
      document.activeElement !== searchInput &&
      modal.style.display === "none"
    ) {
      const searchValue = searchInput.value;
      searchInput.value = searchValue;
    }
  }
}

// Handle successful deletion
ipcRenderer.on("material-deleted", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  }
  loadMaterials();
});

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("addMaterialModal");
  if (event.target === modal) {
    closeModal();
  }
};

// Prevent modal from closing when clicking inside
document.addEventListener("click", function (event) {
  const modalContent = document.querySelector(".modal-content");
  if (modalContent && modalContent.contains(event.target)) {
    event.stopPropagation();
  }
});

// Prevent form submission on enter
document.addEventListener("keydown", function (event) {
  if (
    event.key === "Enter" &&
    event.target.tagName.toLowerCase() !== "textarea"
  ) {
    event.preventDefault();
  }
});

// Keep search input enabled
document.addEventListener("click", function (event) {
  const searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.disabled) {
    searchInput.disabled = false;
  }
});

// Logout/Exit function
function logout() {
  window.location.href = "index.html";
}
