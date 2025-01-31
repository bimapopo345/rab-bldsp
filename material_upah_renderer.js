const { ipcRenderer } = require("electron");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  loadMaterials();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  console.log("Setting up event listeners");
  // Handle search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    console.log("Found search input");
    // Clear and focus the input
    searchInput.value = "";
    searchInput.focus();

    // Add input event listener
    searchInput.addEventListener("input", handleSearch);

    // Add focus event listener for debugging
    searchInput.addEventListener("focus", () =>
      console.log("Search input focused")
    );
    searchInput.addEventListener("blur", () =>
      console.log("Search input lost focus")
    );
  }

  // Stop propagation for modal content clicks
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    modalContent.addEventListener("click", (e) => e.stopPropagation());
  }

  // Handle enter key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName.toLowerCase() !== "textarea") {
      e.preventDefault();
    }
  });
}

// Load materials from the database
function loadMaterials() {
  console.log("Loading materials");
  ipcRenderer.send("get-materials");
}

// Handle materials data received from main process
ipcRenderer.on("materials-data", (event, materials) => {
  console.log("Received materials data");
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

  // Re-enable and focus search input after table update
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    console.log("Focused search input after materials update");
  }
});

// Search functionality
function handleSearch(event) {
  console.log("Search input changed");
  const searchInput = event.target;
  const searchTerm = searchInput.value.trim();

  // Ensure input is enabled
  searchInput.disabled = false;

  if (searchTerm === "") {
    loadMaterials();
  } else {
    ipcRenderer.send("search-materials", searchTerm);
  }
}

// Modal handling
function addNewMaterial() {
  console.log("Opening add material modal");
  const modal = document.getElementById("addMaterialModal");

  // Clear form fields
  document.getElementById("newName").value = "";
  document.getElementById("newUnit").value = "";
  document.getElementById("newPrice").value = "";
  document.getElementById("newCategory").value = "Material";

  modal.style.display = "block";

  // Focus first input
  document.getElementById("newName").focus();
}

function closeModal() {
  console.log("Closing modal");
  const modal = document.getElementById("addMaterialModal");
  modal.style.display = "none";

  // Return focus to search
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    console.log("Focused search input after closing modal");
  }
}

function saveMaterial() {
  console.log("Saving material");
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
  console.log("Material added response received");
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
    console.log("Deleting material:", id);
    // Store search input value before deletion
    const searchInput = document.getElementById("searchInput");
    const searchValue = searchInput ? searchInput.value : "";

    ipcRenderer.send("delete-material", id);

    // Re-enable and focus search input immediately
    if (searchInput) {
      searchInput.disabled = false;
      searchInput.value = searchValue;
      searchInput.focus();
      console.log("Focused search input after delete");
    }
  }
}

// Handle successful deletion
ipcRenderer.on("material-deleted", (event, response) => {
  console.log("Material deleted response received");
  if (response && response.error) {
    alert("Error: " + response.error);
  }

  // Re-enable and focus search input before reloading materials
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.disabled = false;
    searchInput.focus();
    console.log("Focused search input before reloading materials");
  }

  loadMaterials();
});

// Window click handler for modal
window.onclick = function (event) {
  const modal = document.getElementById("addMaterialModal");
  if (event.target === modal) {
    closeModal();
  }
};

// Logout/Exit function
function logout() {
  window.location.href = "index.html";
}
