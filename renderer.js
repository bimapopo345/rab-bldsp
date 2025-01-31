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
