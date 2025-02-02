const { ipcRenderer } = require("electron");

// Check if user is admin
function checkAuth() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return null;
  }
  // Get username to check if admin
  ipcRenderer.send("check-admin", { userId });
  return userId;
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = checkAuth();
  if (userId) {
    loadUsers();
  }
});

function loadUsers() {
  showLoading();
  ipcRenderer.send("get-users");
}

// Handle admin check response
ipcRenderer.on("admin-check-result", (event, isAdmin) => {
  if (!isAdmin) {
    window.location.href = "index.html";
  }
});

// Handle users data
ipcRenderer.on("users-data", (event, users) => {
  hideLoading();
  displayUsers(users);
});

function displayUsers(users) {
  const tableBody = document.getElementById("userTableBody");
  tableBody.innerHTML = "";

  users.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.password}</td>
            <td>${user.hint}</td>
        `;
    tableBody.appendChild(row);
  });
}

function showLoading() {
  const loading = document.getElementById("loadingIndicator");
  if (loading) loading.classList.add("active");
}

function hideLoading() {
  const loading = document.getElementById("loadingIndicator");
  if (loading) loading.classList.remove("active");
}

function goBack() {
  window.location.href = "index.html";
}
