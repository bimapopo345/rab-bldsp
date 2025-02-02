const { ipcRenderer } = require("electron");

let selectedMaterialId = null; // Store selected material ID
let selectedAhsId = 1; // Example AHS ID (use your logic to set this)

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
  ipcRenderer.send("search-materials", searchInput); // Send search term to backend
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

// Select a material and display its details for further actions
function selectMaterial(id, name, price) {
  selectedMaterialId = id;
  document.getElementById("selectedMaterialName").innerText = name;
  document.getElementById("selectedMaterialPrice").innerText = `Rp ${price}`;

  // Koefisien default di sini adalah 1
  const koefisien = 1;

  const total = price * koefisien; // Hitung total berdasarkan koefisien default

  // Menambahkan bahan ke dalam tabel rincian
  const tableBody = document.getElementById("materialDetails");
  const row = document.createElement("tr");
  row.innerHTML = `
      <td>Bahan</td>
      <td>${name}</td>
      <td>kg</td> <!-- Satuan tetap kg, bisa disesuaikan -->
      <td><input type="number" value="${koefisien}" onchange="updateKoefisien(${selectedMaterialId}, this.value)"></td>
      <td>Rp ${price}</td>
      <td>Rp ${total}</td>
  `;
  tableBody.appendChild(row);

  // Kirim data ke backend untuk disimpan
  ipcRenderer.send("add-pricing", {
    ahs_id: selectedAhsId,
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
  });

  closeSearchMaterialModal(); // Menutup modal setelah pemilihan
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

  const total = price * koefisien; // Calculate the total price based on coefficient

  const tableBody = document.getElementById("materialDetails");
  const row = document.createElement("tr");
  row.innerHTML = `
      <td>Bahan</td>
      <td>${name}</td>
      <td>kg</td> <!-- Satuan tetap kg, bisa disesuaikan -->
      <td>${koefisien}</td>
      <td>Rp ${price}</td>
      <td>Rp ${total}</td>
    `;
  tableBody.appendChild(row);

  // Send data to backend to save in pricing table
  ipcRenderer.send("add-pricing", {
    ahs_id: selectedAhsId,
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
  });

  closeKoefisienModal(); // Close coefficient modal
}

// Close the coefficient input modal
function closeKoefisienModal() {
  document.getElementById("koefisienInputModal").style.display = "none";
}

// Close the material search modal
function closeSearchMaterialModal() {
  document.getElementById("searchMaterialModal").style.display = "none";
}

function updateKoefisien(materialId, newKoefisien) {
  // Cari baris yang berhubungan dengan materialId di tabel rincian
  const tableBody = document.getElementById("materialDetails");
  const rows = tableBody.getElementsByTagName("tr");

  // Loop untuk menemukan material yang sedang diubah koefisiennya
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName("td");

    // Jika ID material cocok, perbarui koefisien dan hitung total
    if (
      cells[1].innerText ===
      document.getElementById("selectedMaterialName").innerText
    ) {
      const price = parseFloat(cells[4].innerText.replace("Rp ", ""));
      const totalCell = cells[5];
      const newTotal = price * newKoefisien;
      totalCell.innerText = `Rp ${newTotal}`;

      // Update koefisien di backend
      ipcRenderer.send("update-pricing", {
        ahs_id: selectedAhsId,
        material_id: materialId,
        koefisien: newKoefisien,
      });
    }
  }
}
