const { ipcRenderer } = require("electron");

let selectedMaterialId = null;
let selectedAhsId = null;

// Check if user is logged in
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  return userId;
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  initializeMaterialTable();
});

function openAhsModal() {
  const userId = checkAuth();
  if (!userId) return;

  const modal = document.getElementById("searchAhsModal");
  modal.style.display = "block";
  loadAhs();
}

function closeSearchAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  if (modal) modal.style.display = "none";
}

function loadAhs() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-ahs", { userId });
}

function searchAhs() {
  const userId = checkAuth();
  if (!userId) return;

  const searchInput = document
    .getElementById("searchAhsInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-ahs", { searchTerm: searchInput, userId });
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
  const userId = checkAuth();
  if (!userId) return;

  selectedAhsId = id;
  ipcRenderer.send("get-ahs-by-id", { id, userId });
  ipcRenderer.send("get-pricing", { ahsId: id, userId });
}

ipcRenderer.on("pricing-data", (event, pricingData) => {
  const tableBody = document.getElementById("materialDetails");
  tableBody.innerHTML = "";

  pricingData.forEach((item) => {
    const total = item.price * item.koefisien;
    const row = document.createElement("tr");
    row.dataset.pricingId = item.id;
    row.dataset.materialId = item.material_id;
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
  if (ahs) {
    document.getElementById("kelompok-pekerjaan").value = ahs.kelompok;
    document.getElementById("satuan").value = ahs.satuan;
    document.getElementById("analisa-nama").value = ahs.ahs;
    closeSearchAhsModal();
  }
});

function addBahanUpah() {
  const userId = checkAuth();
  if (!userId) return;

  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "block";
  loadMaterials();
}

function closeSearchMaterialModal() {
  const modal = document.getElementById("searchMaterialModal");
  modal.style.display = "none";
}

function loadMaterials() {
  const userId = checkAuth();
  if (!userId) return;

  ipcRenderer.send("get-materials", { userId });
}

function searchMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const searchInput = document
    .getElementById("searchMaterialInput")
    .value.trim()
    .toLowerCase();
  ipcRenderer.send("search-materials", { searchTerm: searchInput, userId });
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
  const userId = checkAuth();
  if (!userId) return;

  selectedMaterialId = id;
  const koefisien = 1;

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
    ahs_id: selectedAhsId,
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
    userId,
  });

  closeSearchMaterialModal();
}

function updateKoefisien(materialId, newKoefisien) {
  const userId = checkAuth();
  if (!userId) return;

  const input = document.querySelector(
    `input[onchange*="updateKoefisien(${materialId}"]`
  );
  if (!input) return;

  const row = input.closest("tr");
  if (!row) return;

  const pricingId = parseInt(row.dataset.pricingId, 10);
  if (!pricingId) return;

  const cells = row.getElementsByTagName("td");
  const price = parseFloat(cells[4].innerText.replace("Rp ", ""));
  const totalCell = cells[5];
  const newTotal = price * newKoefisien;

  totalCell.innerText = `Rp ${newTotal}`;

  ipcRenderer.send("update-pricing", {
    pricing_id: pricingId,
    ahs_id: parseInt(selectedAhsId, 10),
    koefisien: parseFloat(newKoefisien),
    userId,
  });
}

function initializeMaterialTable() {
  const materialTable = document.getElementById("materialDetails");
  materialTable.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;

    document.querySelectorAll("#materialDetails tr").forEach((r) => {
      r.classList.remove("selected");
    });

    row.classList.add("selected");
  });
}

function deleteMaterial() {
  const userId = checkAuth();
  if (!userId) return;

  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan dihapus");
    return;
  }

  const pricingId = selectedRow.dataset.pricingId;
  if (pricingId) {
    ipcRenderer.send("delete-pricing", { id: parseInt(pricingId, 10), userId });
  }
}

ipcRenderer.on("pricing-deleted", (event, response) => {
  if (response && response.error) {
    alert("Gagal menghapus: " + response.error);
  }
});

ipcRenderer.on("pricing-updated", (event, response) => {
  if (response && response.error) {
    alert("Gagal mengupdate: " + response.error);
  }
});

function editKoefisien() {
  const selectedRow = document.querySelector("#materialDetails tr.selected");
  if (!selectedRow) {
    alert("Silakan pilih bahan/upah yang akan diedit");
    return;
  }

  const koefisienInput = selectedRow.querySelector('input[type="number"]');
  koefisienInput.focus();
}

function logout() {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
}

function goBack() {
  window.location.href = "index.html";
}

// Add CSS for selected row
const style = document.createElement("style");
style.textContent = `
  #materialDetails tr.selected {
    background-color: #e0e7ff !important;
  }
`;
document.head.appendChild(style);
