const { ipcRenderer } = require("electron");

// Login attempt handler
function attemptLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("Username dan password harus diisi");
    return;
  }

  // Send login request to main process
  ipcRenderer.send("login", { username, password });
}

// Listen for login result
ipcRenderer.on("login-result", (event, result) => {
  if (result === "success") {
    showSuccess("Login berhasil");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } else {
    showError("Username atau password salah");
  }
});
