const { ipcRenderer } = require("electron");

let selectedMaterialId = null;
let selectedAhsId = null;

function openAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  modal.style.display = "block"; // Pastikan modal ditampilkan
  loadAhs(); // Kirim permintaan untuk mengambil data AHS
}

function closeSearchAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  if (modal) modal.style.display = "none";
}

function loadAhs() {
  ipcRenderer.send("get-ahs");
}

function searchAhs() {
  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-ahs", searchInput); // Kirim pencarian ke main process
}
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

function selectAhs(id) {
  selectedAhsId = id; // Set AHS ID yang dipilih
  ipcRenderer.send("get-ahs-by-id", id); // Mengambil data AHS berdasarkan id yang dipilih
  ipcRenderer.send("get-pricing", id); // Mengambil data pricing untuk AHS ini
}

// Tambahkan event listener untuk menerima data pricing
ipcRenderer.on("pricing-data", (event, pricingData) => {
  const tableBody = document.getElementById("materialDetails");
  tableBody.innerHTML = ""; // Clear existing data

  pricingData.forEach((item) => {
    const total = item.price * item.koefisien;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>Bahan</td>
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td><input type="number" value="${item.koefisien}" onchange="updateKoefisien(${item.material_id}, this.value)"></td>
      <td>Rp ${item.price}</td>
      <td>Rp ${total}</td>
    `;
    tableBody.appendChild(row);
  });
});

ipcRenderer.on("ahs-data-for-edit", (event, ahs) => {
  console.log("Received AHS data for edit:", ahs); // Periksa data AHS yang diterima
  if (ahs) {
    document.getElementById("kelompok-pekerjaan").value = ahs.kelompok;
    document.getElementById("satuan").value = ahs.satuan;
    document.getElementById("analisa-nama").value = ahs.ahs;
    closeSearchAhsModal(); // Menutup modal setelah data AHS diterima
  }
});

function addBahanUpah() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "block";
  loadMaterials();
}

function closeSearchMaterialModal() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "none";
}

function loadMaterials() {
  ipcRenderer.send("get-materials");
}

function searchMaterial() {
  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-materials", searchInput);
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
  selectedMaterialId = id; // Set selected material ID
  const koefisien = 1; // Set default koefisien

  const total = price * koefisien;

  const tableBody = document.getElementById("materialDetails");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>Bahan</td>
    <td>${name}</td>
    <td>kg</td>  
    <td><input type="number" value="${koefisien}" onchange="updateKoefisien(${selectedMaterialId}, this.value)"></td>
    <td>Rp ${price}</td>
    <td>Rp ${total}</td>
  `;
  tableBody.appendChild(row);

  ipcRenderer.send("add-pricing", {
    ahs_id: selectedAhsId, // Pastikan selectedAhsId sudah benar
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
  });

  closeSearchMaterialModal();
}

function updateKoefisien(materialId, newKoefisien) {
  // Find the row containing the input that triggered this change
  const input = document.querySelector(
    `input[onchange*="updateKoefisien(${materialId}"]`
  );
  if (!input) return;

  const row = input.closest("tr");
  const cells = row.getElementsByTagName("td");

  // Get price from the price cell (index 4) and remove the "Rp " prefix
  const price = parseFloat(cells[4].innerText.replace("Rp ", ""));
  const totalCell = cells[5];
  const newTotal = price * newKoefisien;

  // Update the total cell with the new calculation
  totalCell.innerText = `Rp ${newTotal}`;

  // Send update to main process
  ipcRenderer.send("update-pricing", {
    ahs_id: selectedAhsId,
    material_id: materialId,
    koefisien: newKoefisien,
  });
}

// Add row selection functionality
document.addEventListener("DOMContentLoaded", () => {
  const materialTable = document.getElementById("materialDetails");
  materialTable.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    // Remove selection from other rows
    document.querySelectorAll("#materialDetails tr").forEach((r) => {
      r.classList.remove("selected");
    });

    // Add selection to clicked row
    row.classList.add("selected");
  });
});

function deleteMaterial() {
  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan dihapus");
    return;
  }

  // Get the material ID from the koefisien input's onchange attribute
  const koefisienInput = selectedRow.querySelector('input[type="number"]');
  const match = koefisienInput
    .getAttribute("onchange")
    .match(/updateKoefisien\((\d+)/);
  if (match) {
    const materialId = match[1];
    ipcRenderer.send("delete-pricing", materialId);
    selectedRow.remove();
  }
}

function editKoefisien() {
  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan diedit");
    return;
  }

  const koefisienInput = selectedRow.querySelector('input[type="number"]');
  koefisienInput.focus();
}

function goBack() {
  window.location.href = "index.html"; // Ganti dengan alamat homepage Anda
}

// Add CSS for selected row
const style = document.createElement("style");
style.textContent = `
  #materialDetails tr.selected {
    background-color: #e0e7ff !important;
  }
`;
document.head.appendChild(style);
