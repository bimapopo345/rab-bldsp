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
