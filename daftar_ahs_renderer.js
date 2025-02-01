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
    if (!searchInput.hasAttribute("data-has-handler")) {
      searchInput.addEventListener("input", (event) => {
        const searchTerm = event.target.value.trim();
        if (searchTerm === "") {
          loadAhs(); // Load all AHS if search is cleared
        } else {
          ipcRenderer.send("search-ahs", searchTerm); // Send search term to the main process
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
  const searchTerm = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const filteredAhs = ahs.filter(
    (item) =>
      item.kelompok.toLowerCase().includes(searchTerm) ||
      item.ahs.toLowerCase().includes(searchTerm)
  );

  const tableBody = document.getElementById("ahsTableBody");
  tableBody.innerHTML = "";

  filteredAhs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.kelompok}</td>
      <td>${item.kode_ahs}</td>
      <td>${item.ahs}</td>
      <td>${item.satuan}</td>
      <td>
        <button onclick="editAhs(${item.id})">Edit</button>
        <button onclick="deleteAhs(${item.id})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("ahsCount").textContent = filteredAhs.length;
});

// Add new AHS
function addNewAhs() {
  const modal = document.getElementById("addAhsModal");

  // Clear form fields
  document.getElementById("newKelompok").value = "";
  document.getElementById("newKodeAhs").value = "";
  document.getElementById("newAhs").value = "";
  document.getElementById("newSatuan").value = "";

  modal.style.display = "block";
}

// Close modal
function closeAhsModal() {
  const modal = document.getElementById("addAhsModal");
  if (modal) modal.style.display = "none";
}

// Save new AHS
function saveAhs() {
  const kelompok = document.getElementById("newKelompok").value.trim();
  const kodeAhs = document.getElementById("newKodeAhs").value.trim();
  const ahs = document.getElementById("newAhs").value.trim();
  const satuan = document.getElementById("newSatuan").value.trim();

  if (!kelompok || !kodeAhs || !ahs || !satuan) {
    alert("Semua field harus diisi!");
    return;
  }

  // Send AHS data to backend to save in the database
  ipcRenderer.send("add-ahs", {
    kelompok,
    kode_ahs: kodeAhs,
    ahs,
    satuan,
  });

  closeAhsModal(); // Close modal after saving
}

// Handle AHS added successfully
ipcRenderer.on("ahs-added", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data after adding
  }
});

// Edit AHS functionality
function editAhs(id) {
  currentAhsId = id;
  ipcRenderer.send("get-ahs-by-id", id); // Send request for specific AHS by ID
}

// Handle the AHS data for editing modal
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (ahs && ahs.id === currentAhsId) {
    document.getElementById("editKelompok").value = ahs.kelompok;
    document.getElementById("editKodeAhs").value = ahs.kode_ahs;
    document.getElementById("editAhs").value = ahs.ahs;
    document.getElementById("editSatuan").value = ahs.satuan;

    // Show the edit modal
    const modal = document.getElementById("editAhsModal");
    modal.style.display = "block";
  }
});

// Close Edit modal
function closeEditAhsModal() {
  const modal = document.getElementById("editAhsModal");
  if (modal) modal.style.display = "none";
}

// Update AHS
function updateAhs() {
  const kelompok = document.getElementById("editKelompok").value.trim();
  const kodeAhs = document.getElementById("editKodeAhs").value.trim();
  const ahs = document.getElementById("editAhs").value.trim();
  const satuan = document.getElementById("editSatuan").value.trim();

  if (!kelompok || !kodeAhs || !ahs || !satuan) {
    alert("Semua field harus diisi!");
    return;
  }

  // Kirim data yang diperbarui ke backend untuk disimpan di database
  ipcRenderer.send("update-ahs", {
    id: currentAhsId,
    kelompok,
    kode_ahs: kodeAhs,
    ahs,
    satuan,
  });

  closeEditAhsModal(); // Menutup modal setelah update
}

// Handle AHS updated successfully
ipcRenderer.on("ahs-updated", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data setelah update
  }
});

// Fungsi kembali ke halaman utama
function goBack() {
  window.location.href = "index.html"; // Ganti dengan alamat homepage Anda
}

// Delete AHS
function deleteAhs(id) {
  if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
    ipcRenderer.send("delete-ahs", id);
  }
}

// Handle AHS deletion
ipcRenderer.on("ahs-deleted", (event, response) => {
  if (response && response.error) {
    alert("Error: " + response.error);
  } else {
    loadAhs(); // Reload AHS data after deletion
  }
});
