const { ipcRenderer } = require("electron");

function attemptLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    document.getElementById("message").innerText =
      "Username dan password harus diisi!";
    return;
  }

  ipcRenderer.send("login", { username, password });
}

ipcRenderer.on("login-result", (event, result) => {
  if (result === "success") {
    window.location.replace("index.html");
  } else {
    document.getElementById("message").innerText =
      "Login gagal! Username atau password salah.";
  }
});

let materials = [];

// Fetch materials from the database (Simulating data for now)
function fetchMaterials() {
  // Simulated data (you can replace this with actual data from your database)
  materials = [
    {
      name: "Air",
      satuan: "Liter",
      harga: 100,
      kategori: "BAHAN",
      update: "07-Mei-18 06:49",
    },
    {
      name: "Akustik 30 x 30 cm",
      satuan: "Lembar",
      harga: 60000,
      kategori: "BAHAN",
      update: "21-Okt",
    },
    {
      name: "Alang-alang",
      satuan: "Ikat",
      harga: 60000,
      kategori: "BAHAN",
      update: "12-Nov",
    },
    // More mock data can be added here...
  ];

  renderMaterialTable();
}

// Render the material table
function renderMaterialTable() {
  const tableBody = document.getElementById("materialTableBody");
  tableBody.innerHTML = "";

  materials.forEach((material, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${material.name}</td>
            <td>${material.satuan}</td>
            <td>${material.harga.toLocaleString()}</td>
            <td>${material.kategori}</td>
            <td>${material.update}</td>
            <td>
                <button onclick="editMaterial(${index})">Edit</button>
                <button onclick="deleteMaterial(${index})">Delete</button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  // Update total count
  document.getElementById("materialCount").textContent = materials.length;
}

// Add a new material (Placeholder for now)
function addNewMaterial() {
  alert("Open modal to add new material"); // Placeholder for actual add logic
}

// Edit an existing material
function editMaterial(index) {
  const material = materials[index];
  alert(`Editing material: ${material.name}`);
  // Implement actual editing logic here
}

// Delete a material
function deleteMaterial(index) {
  materials.splice(index, 1);
  renderMaterialTable();
}

// Search for materials
function searchMaterial() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(query)
  );
  materials = filteredMaterials;
  renderMaterialTable();
}

// Logout action (Redirect back to login page)
function logout() {
  window.location.replace("login.html");
}

// Fetch materials on page load
window.onload = fetchMaterials;
