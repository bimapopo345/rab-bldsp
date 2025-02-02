const { ipcRenderer } = require("electron");

let selectedMaterialId = null;
let selectedAhsId = 1;

function openAhsModal() {
  const modal = document.getElementById("searchAhsModal");
  modal.style.display = "block";
  loadAhs();
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
  ipcRenderer.send("search-ahs", searchInput);
}

ipcRenderer.on("ahs-data", (event, ahs) => {
  console.log("Received AHS data:", ahs); // Check data
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
}

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
  selectedMaterialId = id;
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
    ahs_id: selectedAhsId,
    material_id: selectedMaterialId,
    quantity: koefisien,
    koefisien: koefisien,
  });

  closeSearchMaterialModal();
}

function updateKoefisien(materialId, newKoefisien) {
  const tableBody = document.getElementById("materialDetails");
  const rows = tableBody.getElementsByTagName("tr");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.getElementsByTagName("td");

    if (
      cells[1].innerText ===
      document.getElementById("selectedMaterialName").innerText
    ) {
      const price = parseFloat(cells[4].innerText.replace("Rp ", ""));
      const totalCell = cells[5];
      const newTotal = price * newKoefisien;
      totalCell.innerText = `Rp ${newTotal}`;

      ipcRenderer.send("update-pricing", {
        ahs_id: selectedAhsId,
        material_id: materialId,
        koefisien: newKoefisien,
      });
    }
  }
}

function goBack() {
  window.location.href = "index.html"; // Ganti dengan alamat homepage Anda
}
