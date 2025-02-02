function setupMaterialHandlers(ipcMain, db) {
  // Get all materials
  ipcMain.on("get-materials", (event) => {
    db.all("SELECT * FROM materials", (err, materials) => {
      if (err) {
        console.error("Error fetching materials:", err);
        event.reply("materials-data", []);
        return;
      }
      event.reply("materials-data", materials);
    });
  });

  // Search materials
  ipcMain.on("search-materials", (event, searchTerm) => {
    const query = `%${searchTerm}%`;
    db.all(
      "SELECT * FROM materials WHERE name LIKE ? OR category LIKE ?",
      [query, query],
      (err, materials) => {
        if (err) {
          console.error("Error searching materials:", err);
          event.reply("materials-data", []);
          return;
        }
        event.reply("materials-data", materials);
      }
    );
  });

  // Add new material
  ipcMain.on("add-material", (event, material) => {
    db.run(
      "INSERT INTO materials (name, unit, price, category) VALUES (?, ?, ?, ?)",
      [material.name, material.unit, material.price, material.category],
      (err) => {
        if (err) {
          console.error("Error adding material:", err);
          event.reply("material-added", { error: err.message });
          return;
        }
        event.reply("material-added");
      }
    );
  });

  // Delete material
  ipcMain.on("delete-material", (event, id) => {
    db.run("DELETE FROM materials WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("Error deleting material:", err);
        event.reply("material-deleted", { error: err.message });
        return;
      }
      event.reply("material-deleted");
      event.reply("focus-search");
    });
  });

  // Get material by ID
  ipcMain.on("get-material-by-id", (event, id) => {
    db.get("SELECT * FROM materials WHERE id = ?", [id], (err, material) => {
      if (err) {
        console.error("Error fetching material:", err);
        event.reply("material-data", {});
        return;
      }
      event.reply("material-data", material);
    });
  });

  // Update material
  ipcMain.on(
    "update-material",
    (event, { id, name, unit, price, category }) => {
      db.run(
        "UPDATE materials SET name = ?, unit = ?, price = ?, category = ? WHERE id = ?",
        [name, unit, price, category, id],
        (err) => {
          if (err) {
            console.error("Error updating material:", err);
            event.reply("material-updated", { error: err.message });
            return;
          }
          event.reply("material-updated", { success: true });
        }
      );
    }
  );

  // Sort materials
  ipcMain.on("sort-materials", (event, { column, direction }) => {
    const query = `SELECT * FROM materials ORDER BY ${column} ${
      direction === "asc" ? "ASC" : "DESC"
    }`;
    db.all(query, [], (err, materials) => {
      if (err) {
        console.error("Error sorting materials:", err);
        event.reply("sorted-materials", []);
        return;
      }
      event.reply("sorted-materials", materials);
    });
  });
}

module.exports = { setupMaterialHandlers };
