const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");

function setupExportHandlers(ipcMain, db) {
  // Export user data to Excel - for regular users
  ipcMain.handle("export-my-data", async (event, userId) => {
    const workbook = new ExcelJS.Workbook();

    try {
      // Get user data
      const userData = await new Promise((resolve, reject) => {
        db.get(
          "SELECT username FROM users WHERE id = ?",
          [userId],
          (err, user) => {
            if (err) reject(err);
            else resolve(user);
          }
        );
      });

      // Export materials
      const materialsSheet = workbook.addWorksheet("Materials");
      materialsSheet.columns = [
        { header: "Name", key: "name", width: 20 },
        { header: "Unit", key: "unit", width: 10 },
        { header: "Price", key: "price", width: 15 },
        { header: "Category", key: "category", width: 15 },
        { header: "Description", key: "description", width: 30 },
      ];

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, unit, price, category, description FROM materials WHERE user_id = ?",
          [userId],
          (err, materials) => {
            if (err) reject(err);
            else {
              materials.forEach((material) => materialsSheet.addRow(material));
              resolve();
            }
          }
        );
      });

      // Export AHS
      const ahsSheet = workbook.addWorksheet("AHS");
      ahsSheet.columns = [
        { header: "Kelompok", key: "kelompok", width: 20 },
        { header: "Kode AHS", key: "kode_ahs", width: 15 },
        { header: "AHS", key: "ahs", width: 30 },
        { header: "Satuan", key: "satuan", width: 10 },
      ];

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT kelompok, kode_ahs, ahs, satuan FROM ahs WHERE user_id = ?",
          [userId],
          (err, ahsData) => {
            if (err) reject(err);
            else {
              ahsData.forEach((ahs) => ahsSheet.addRow(ahs));
              resolve();
            }
          }
        );
      });

      // Export Projects
      const projectsSheet = workbook.addWorksheet("Projects");
      projectsSheet.columns = [
        { header: "Name", key: "name", width: 20 },
        { header: "Location", key: "location", width: 30 },
      ];

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT name, location FROM projects WHERE user_id = ?",
          [userId],
          (err, projects) => {
            if (err) reject(err);
            else {
              projects.forEach((project) => projectsSheet.addRow(project));
              resolve();
            }
          }
        );
      });

      // Export Pricing
      const pricingSheet = workbook.addWorksheet("Pricing");
      pricingSheet.columns = [
        { header: "AHS ID", key: "ahs_id", width: 15 },
        { header: "Material ID", key: "material_id", width: 15 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Koefisien", key: "koefisien", width: 15 },
      ];

      await new Promise((resolve, reject) => {
        db.all(
          "SELECT ahs_id, material_id, quantity, koefisien FROM pricing WHERE user_id = ?",
          [userId],
          (err, pricing) => {
            if (err) reject(err);
            else {
              pricing.forEach((price) => pricingSheet.addRow(price));
              resolve();
            }
          }
        );
      });

      // Save the workbook
      const fileName = `${userData.username}_data_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const { filePath } = await dialog.showSaveDialog({
        title: "Save Excel File",
        defaultPath: fileName,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        await workbook.xlsx.writeFile(filePath);
        return { success: true, message: "Data berhasil diekspor" };
      } else {
        return { success: false, message: "Export dibatalkan" };
      }
    } catch (error) {
      console.error("Export error:", error);
      return {
        success: false,
        message: "Error mengekspor data: " + error.message,
      };
    }
  });

  // Export database - admin only
  ipcMain.handle("export-database", async (event) => {
    try {
      const sourceFile = "database.sqlite";

      const { filePath } = await dialog.showSaveDialog({
        title: "Save Database File",
        defaultPath: `database_export_${
          new Date().toISOString().split("T")[0]
        }.sqlite`,
        filters: [{ name: "SQLite Database", extensions: ["sqlite"] }],
      });

      if (filePath) {
        await new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(sourceFile);
          const writeStream = fs.createWriteStream(filePath);

          readStream.on("error", reject);
          writeStream.on("error", reject);
          writeStream.on("finish", resolve);

          readStream.pipe(writeStream);
        });

        return { success: true, message: "Database berhasil diekspor" };
      } else {
        return { success: false, message: "Export dibatalkan" };
      }
    } catch (error) {
      console.error("Database export error:", error);
      return {
        success: false,
        message: "Error mengekspor database: " + error.message,
      };
    }
  });
}

module.exports = { setupExportHandlers };
