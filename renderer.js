const { ipcRenderer } = require("electron");

// Login function
function attemptLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    showError("Mohon isi username dan password");
    return;
  }

  ipcRenderer.send("login", { username, password });
}

// Register function
function attemptRegister() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;
  const hint = document.getElementById("regHint").value;

  if (!username || !password || !confirmPassword || !hint) {
    showError("Mohon isi semua field");
    return;
  }

  if (password !== confirmPassword) {
    showError("Password tidak cocok");
    return;
  }

  ipcRenderer.send("register", { username, password, hint });
}

// Reset password function
function attemptReset() {
  const username = document.getElementById("resetUsername").value;
  const hint = document.getElementById("resetHint").value;

  if (!username || !hint) {
    showError("Mohon isi username dan hint");
    return;
  }

  ipcRenderer.send("reset-password", { username, hint });
}

// IPC response listeners
ipcRenderer.on("login-result", (event, result) => {
  if (result.success) {
    showSuccess(result.message);
    localStorage.setItem("userId", result.userId);
    // Navigate to main page after successful login
    window.location.href = "index.html";
  } else {
    showError(result.message);
  }
});

ipcRenderer.on("register-result", (event, result) => {
  if (result.success) {
    showSuccess(result.message);
    // Switch back to login form after successful registration
    setTimeout(() => {
      showLoginForm();
      clearFormInputs("registerForm");
    }, 2000);
  } else {
    showError(result.message);
  }
});

ipcRenderer.on("reset-result", (event, result) => {
  if (result.success) {
    showSuccess(result.message);
    // Switch back to login form after showing new password
    setTimeout(() => {
      showLoginForm();
      clearFormInputs("resetForm");
    }, 5000);
  } else {
    showError(result.message);
  }
});

// Utility function to clear form inputs
function clearFormInputs(formId) {
  const form = document.getElementById(formId);
  if (form) {
    const inputs = form.getElementsByTagName("input");
    for (let input of inputs) {
      input.value = "";
    }
  }
}

// Enter key handler for login form
document
  .getElementById("password")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      attemptLogin();
    }
  });
