const { ipcRenderer } = require("electron");

// Show summary report
function showSummaryReport() {
  document.getElementById("summaryReport").style.display = "block";
  document.getElementById("detailReport").style.display = "none";
  loadSummaryData();
}

// Show detail report
function showDetailReport() {
  document.getElementById("summaryReport").style.display = "none";
  document.getElementById("detailReport").style.display = "block";
  loadDetailData();
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Load summary data
function loadSummaryData() {
  ipcRenderer.send("get-summary-data");
}

// Load detail data
function loadDetailData() {
  ipcRenderer.send("get-detail-data");
}

// Handle summary data response
ipcRenderer.on("summary-data", (event, data) => {
  const tbody = document.getElementById("summaryTableBody");
  tbody.innerHTML = "";
  let totalBiaya = 0;

  data.forEach((item) => {
    const row = document.createElement("tr");
    const biaya = item.hrg_satuan * item.volume;
    totalBiaya += biaya;

    row.innerHTML = `
            <td>${item.deskripsi}</td>
            <td>${item.satuan}</td>
            <td>${formatCurrency(item.hrg_satuan)}</td>
            <td>${item.volume}</td>
            <td>${formatCurrency(biaya)}</td>
        `;
    tbody.appendChild(row);
  });

  document.getElementById("summaryTotal").textContent =
    formatCurrency(totalBiaya);
});

// Handle detail data response
ipcRenderer.on("detail-data", (event, data) => {
  const container = document.getElementById("ahsGroups");
  container.innerHTML = "";

  Object.entries(data).forEach(([kelompok, items]) => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "ahs-group";
    let groupTotal = 0;

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = `
            <tr>
                <th colspan="5" class="ahs-title">${kelompok}</th>
            </tr>
            <tr>
                <th>Deskripsi</th>
                <th>Satuan</th>
                <th>HRG Satuan</th>
                <th>Volume</th>
                <th>Biaya</th>
            </tr>
        `;

    const tbody = document.createElement("tbody");
    items.forEach((item) => {
      const biaya = item.hrg_satuan * item.volume;
      groupTotal += biaya;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${item.deskripsi}</td>
                <td>${item.satuan}</td>
                <td>${formatCurrency(item.hrg_satuan)}</td>
                <td>${item.volume}</td>
                <td>${formatCurrency(biaya)}</td>
            `;
      tbody.appendChild(row);
    });

    const tfoot = document.createElement("tfoot");
    tfoot.innerHTML = `
            <tr class="total-row">
                <td colspan="4">Total ${kelompok}</td>
                <td>${formatCurrency(groupTotal)}</td>
            </tr>
        `;

    table.appendChild(thead);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    groupDiv.appendChild(table);
    container.appendChild(groupDiv);
  });
});

// Show summary report by default when page loads
showSummaryReport();
