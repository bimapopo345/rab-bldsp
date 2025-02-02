function setupAuthHandlers(ipcMain, db) {
  // Login handler
  ipcMain.on("login", (event, { username, password }) => {
    db.get(
      "SELECT * FROM admin WHERE username = ? AND password = ?",
      [username, password],
      (err, user) => {
        if (err) {
          console.error("Login error:", err);
          event.reply("login-result", "failure");
          return;
        }
        event.reply("login-result", user ? "success" : "failure");
      }
    );
  });
}

module.exports = { setupAuthHandlers };
