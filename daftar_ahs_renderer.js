const { ipcRenderer } = require("electron");

let currentAhsId = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadAhs();
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
          loadAhs();
        } else {
          ipcRenderer.send("search-ahs", searchTerm);
        }
      });
      searchInput.setAttribute("data-has-handler", "true");
    }
  }
}

// Load AHS data from the database
function loadAhs() {
  ipcRenderer.send("get-ahs");
}

// Handle AHS data received from main process
ipcRenderer.on("ahs-data", (event, ahs) => {
  const tableBody = document.getElementById("ahsTableBody");
  tableBody.innerHTML = "";

  ahs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.kelompok}</td>
        <td>${item.kode_ahs}</td>
        <td>${item.ahs}</td>
        <td>${item.satuan}</td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("ahsCount").textContent = ahs.length;
});

// Add new AHS
function addNewAhs() {
  alert("Open modal to add new AHS"); // Implement logic here for modal
}

// Edit AHS functionality
function editAhs(id) {
  currentAhsId = id;
  ipcRenderer.send("get-ahs-by-id", id);
}

// Delete AHS functionality
function deleteAhs(id) {
  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-ahs", id);
  }
}

// Handle AHS deletion confirmation
ipcRenderer.on("ahs-deleted", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload data after deletion
  }
});
