function setupAHSHandlers(ipcMain, db) {
  // Get all AHS
  ipcMain.on("get-ahs", (event) => {
    db.all("SELECT * FROM ahs", (err, ahs) => {
      if (err) {
        console.error("Error fetching AHS:", err);
        event.reply("ahs-data", []);
        return;
      }
      event.reply("ahs-data", ahs);
    });
  });

  // Get AHS by ID
  ipcMain.on("get-ahs-by-id", (event, id) => {
    db.get("SELECT * FROM ahs WHERE id = ?", [id], (err, ahs) => {
      if (err) {
        console.error("Error fetching AHS by ID:", err);
        event.reply("ahs-data-for-edit", null);
        return;
      }
      event.reply("ahs-data-for-edit", ahs);
    });
  });

  // Add AHS
  ipcMain.on("add-ahs", (event, ahsData) => {
    db.run(
      "INSERT INTO ahs (kelompok, kode_ahs, ahs, satuan) VALUES (?, ?, ?, ?)",
      [ahsData.kelompok, ahsData.kode_ahs, ahsData.ahs, ahsData.satuan],
      (err) => {
        if (err) {
          console.error("Error adding AHS:", err);
          event.reply("ahs-added", { error: err.message });
          return;
        }
        event.reply("ahs-added");
      }
    );
  });

  // Update AHS
  ipcMain.on("update-ahs", (event, ahsData) => {
    db.run(
      "UPDATE ahs SET kelompok = ?, kode_ahs = ?, ahs = ?, satuan = ? WHERE id = ?",
      [
        ahsData.kelompok,
        ahsData.kode_ahs,
        ahsData.ahs,
        ahsData.satuan,
        ahsData.id,
      ],
      (err) => {
        if (err) {
          console.error("Error updating AHS:", err);
          event.reply("ahs-updated", { error: err.message });
          return;
        }
        event.reply("ahs-updated");
      }
    );
  });

  // Delete AHS
  ipcMain.on("delete-ahs", (event, id) => {
    db.run("DELETE FROM ahs WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error deleting AHS:", err);
        event.reply("ahs-deleted", { error: err.message });
        return;
      }
      event.reply("ahs-deleted");
    });
  });

  // Search AHS
  ipcMain.on("search-ahs", (event, searchTerm) => {
    const query = "%" + searchTerm + "%";
    db.all(
      "SELECT * FROM ahs WHERE kelompok LIKE ? OR ahs LIKE ?",
      [query, query],
      (err, results) => {
        if (err) {
          console.error("Error searching AHS:", err);
          event.reply("ahs-data", []);
          return;
        }
        event.reply("ahs-data", results);
      }
    );
  });

  // Sort AHS
  ipcMain.on("sort-ahs", (event, { column, direction }) => {
    const query = `SELECT * FROM ahs ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;
    db.all(query, [], (err, ahs) => {
      if (err) {
        console.error("Error sorting AHS:", err);
        event.reply("sorted-ahs", []);
        return;
      }
      event.reply("sorted-ahs", ahs);
    });
  });
}

module.exports = { setupAHSHandlers };
