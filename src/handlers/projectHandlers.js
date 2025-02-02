function setupProjectHandlers(ipcMain, db) {
  // Get latest project
  ipcMain.on("get-project", (event) => {
    db.get(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 1",
      (err, project) => {
        if (err) {
          console.error("Error loading project:", err);
          event.reply("project-data", null);
          return;
        }
        event.reply("project-data", project);
      }
    );
  });

  // Save/Update project
  ipcMain.on("save-project", (event, { name, location }) => {
    // First check if project exists
    db.get(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 1",
      (err, existingProject) => {
        if (err) {
          console.error("Error checking project:", err);
          event.reply("project-saved", { success: false, error: err.message });
          return;
        }

        if (existingProject) {
          // Update existing project
          db.run(
            "UPDATE projects SET name = ?, location = ? WHERE id = ?",
            [name, location, existingProject.id],
            (err) => {
              if (err) {
                console.error("Error updating project:", err);
                event.reply("project-saved", {
                  success: false,
                  error: err.message,
                });
                return;
              }
              event.reply("project-saved", {
                success: true,
                message: "Data proyek berhasil diperbarui",
              });
              // Send updated project data
              db.get(
                "SELECT * FROM projects WHERE id = ?",
                [existingProject.id],
                (err, updatedProject) => {
                  if (!err && updatedProject) {
                    event.reply("project-data", updatedProject);
                  }
                }
              );
            }
          );
        } else {
          // Create new project
          db.run(
            "INSERT INTO projects (name, location) VALUES (?, ?)",
            [name, location],
            function (err) {
              if (err) {
                console.error("Error saving project:", err);
                event.reply("project-saved", {
                  success: false,
                  error: err.message,
                });
                return;
              }
              event.reply("project-saved", {
                success: true,
                message: "Data proyek berhasil disimpan",
              });
              // Send new project data
              db.get(
                "SELECT * FROM projects WHERE id = ?",
                [this.lastID],
                (err, newProject) => {
                  if (!err && newProject) {
                    event.reply("project-data", newProject);
                  }
                }
              );
            }
          );
        }
      }
    );
  });
}

module.exports = { setupProjectHandlers };
