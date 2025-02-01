const { ipcRenderer } = require("electron");

// Open the search modal
function openAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  modal.style.display = "block";
  loadAhs(); // Load AHS data on modal open
}

// Close the search modal
function closeSearchAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  if (modal) modal.style.display = "none";
}

// Load AHS data for searching
function loadAhs() {
  ipcRenderer.send("get-ahs");
}

// Handle AHS search results
function searchAhs() {
  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-ahs", searchInput); // Send the search term to backend
}

// Handle AHS data for search
ipcRenderer.on("ahs-data", (event, ahs) => {
  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  const filteredAhs = ahs.filter(
    (item) =>
      item.kelompok.toLowerCase().includes(searchInput) ||
      item.ahs.toLowerCase().includes(searchInput)
  );

  const tableBody = document.getElementById("ahsSearchResults");
  tableBody.innerHTML = "";

  filteredAhs.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${item.kelompok}</td>
            <td>${item.kode_ahs}</td>
            <td>${item.ahs}</td>
            <td>${item.satuan}</td>
            <td><button onclick="selectAhs(${item.id})">Pilih</button></td>
        `;
    tableBody.appendChild(row);
  });
});

// Select an AHS and autofill data
function selectAhs(id) {
  ipcRenderer.send("get-ahs-by-id", id); // Get AHS details by ID
}

// Handle AHS data for autofill
ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  if (ahs) {
    // Autofill the selected AHS data
    document.getElementById("kelompok-pekerjaan").value = ahs.kelompok;
    document.getElementById("satuan").value = ahs.satuan;
    document.getElementById("analisa-nama").value = ahs.ahs; // Optional: autofill the AHS name if needed
    closeSearchAhsModal(); // Close the modal once a selection is made
  }
});

// Go back to the previous page
function goBack() {
  window.location.href = "index.html"; // Navigate to the main page
}

function addBahanUpah() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "block"; // Open the modal
  loadMaterials(); // Fetch materials when modal opens
}

function closeSearchMaterialModal() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "none"; // Close the modal
}

function loadMaterials() {
  ipcRenderer.send("get-materials"); // Fetch materials from the backend
}

function searchMaterial() {
  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-materials", searchInput); // Send the search term to the backend
}

ipcRenderer.on("materials-data", (event, materials) => {
  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  const filteredMaterials = materials.filter(
    (item) =>
      item.name.toLowerCase().includes(searchInput) ||
      item.category.toLowerCase().includes(searchInput)
  );

  const tableBody = document.getElementById("materialSearchResults");
  tableBody.innerHTML = "";

  filteredMaterials.forEach((material) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.unit}</td>
            <td>Rp ${material.price}</td>
            <td>${material.category}</td>
            <td><button onclick="selectMaterial(${material.id}, '${material.name}', ${material.price})">Pilih</button></td>
        `;
    tableBody.appendChild(row);
  });
});

function selectMaterial(id, name, price) {
  document.getElementById("selectedMaterialName").innerText = name; // Show selected material name
  document.getElementById("selectedMaterialPrice").innerText = `Rp ${price}`; // Show selected material price
  document.getElementById("koefisienInputModal").style.display = "block"; // Show koefisien input modal
  closeSearchMaterialModal(); // Close the modal after selection
}

function addMaterialToTable() {
  const name = document.getElementById("selectedMaterialName").innerText;
  const price = parseFloat(
    document
      .getElementById("selectedMaterialPrice")
      .innerText.replace("Rp ", "")
  );
  const koefisien = parseFloat(document.getElementById("koefisien").value);

  if (!name || !koefisien) {
    alert("Pilih bahan dan masukkan koefisien.");
    return;
  }

  const total = price * koefisien; // Calculate the total

  const tableBody = document.getElementById("materialDetails");
  const row = document.createElement("tr");
  row.innerHTML = `
          <td>Bahan</td>
          <td>${name}</td>
          <td>kg</td> <!-- Assuming unit is kg; adjust if necessary -->
          <td>${koefisien}</td>
          <td>Rp ${price}</td>
          <td>Rp ${total}</td>
      `;
  tableBody.appendChild(row);
  closeKoefisienModal(); // Close the modal after adding material
}

function closeKoefisienModal() {
  const modal = document.getElementById("koefisienInputModal");
  modal.style.display = "none"; // Close the koefisien input modal
}
