const ExcelJS = require("exceljs");
const path = require("path");
const { app } = require("electron");

function setupPrintHandlers(ipcMain, db) {
  // Handle RAB printing requests
  ipcMain.on("print-rab", async (event, type) => {
    const workbook = new ExcelJS.Workbook();

    try {
      // Get project info
      const project = await getProject(db);
      if (!project) {
        throw new Error("Proyek tidak ditemukan");
      }

      // Create filename based on project and type
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `RAB_${project.name.replace(
        /\s+/g,
        "_"
      )}_${type}_${timestamp}.xlsx`;
      const filePath = path.join(app.getPath("downloads"), filename);

      // Set workbook properties
      workbook.creator = "RAB System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Add sheets based on type
      switch (type) {
        case "all":
          await addProjectSheet(workbook, project);
          await addAHSSheet(workbook, db);
          await addMaterialSheet(workbook, db);
          await addWageSheet(workbook, db);
          break;
        case "wages":
          await addProjectSheet(workbook, project);
          await addWageSheet(workbook, db);
          break;
        case "materials":
          await addProjectSheet(workbook, project);
          await addMaterialSheet(workbook, db);
          break;
        case "ahs":
          await addProjectSheet(workbook, project);
          await addAHSSheet(workbook, db);
          break;
      }

      // Save workbook
      await workbook.xlsx.writeFile(filePath);
      event.reply("print-complete", { success: true, path: filePath });
    } catch (error) {
      console.error("Error generating Excel:", error);
      event.reply("print-error", error.message);
    }
  });
}

// Get project info
function getProject(db) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM projects ORDER BY created_at DESC LIMIT 1",
      (err, project) => {
        if (err) reject(err);
        else resolve(project);
      }
    );
  });
}

// Add project information sheet
async function addProjectSheet(workbook, project) {
  const sheet = workbook.addWorksheet("Informasi Proyek");

  // Set column widths
  sheet.columns = [
    { header: "Informasi", key: "info", width: 20 },
    { header: "Detail", key: "detail", width: 40 },
  ];

  // Add title
  sheet.mergeCells("A1:B1");
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = "RENCANA ANGGARAN BIAYA (RAB)";
  titleRow.font = { bold: true, size: 16 };
  titleRow.alignment = { horizontal: "center" };

  // Add project details
  sheet.addRow(["Nama Proyek", project.name]);
  sheet.addRow(["Lokasi", project.location]);
  sheet.addRow(["Tanggal", new Date().toLocaleDateString("id-ID")]);

  // Style the sheet
  sheet.getRow(1).height = 30;
  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (rowNumber > 1) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });
}

// Add AHS sheet
async function addAHSSheet(workbook, db) {
  return new Promise((resolve, reject) => {
    const sheet = workbook.addWorksheet("Analisa Harga Satuan");

    // Set columns
    sheet.columns = [
      { header: "Kelompok", key: "kelompok", width: 15 },
      { header: "Kode AHS", key: "kode_ahs", width: 12 },
      { header: "AHS", key: "ahs", width: 40 },
      { header: "Satuan", key: "satuan", width: 10 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };

    // Get data
    db.all("SELECT * FROM ahs ORDER BY kelompok, kode_ahs", [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      // Add data
      rows.forEach((row) => {
        sheet.addRow(row);
      });

      // Style cells
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      resolve();
    });
  });
}

// Add material sheet
async function addMaterialSheet(workbook, db) {
  return new Promise((resolve, reject) => {
    const sheet = workbook.addWorksheet("Material");

    sheet.columns = [
      { header: "Deskripsi", key: "deskripsi", width: 40 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "HRG Satuan", key: "hrg_satuan", width: 15 },
      { header: "Volume", key: "volume", width: 10 },
      { header: "Biaya", key: "biaya", width: 20 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };

    const query = `
            SELECT 
                a.ahs as deskripsi,
                a.satuan,
                m.price as hrg_satuan,
                p.koefisien as volume
            FROM ahs a
            LEFT JOIN pricing p ON a.id = p.ahs_id
            LEFT JOIN materials m ON p.material_id = m.id
            WHERE p.koefisien IS NOT NULL
            AND LOWER(m.category) != 'upah'
            ORDER BY a.kelompok, a.kode_ahs
        `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      let totalBiaya = 0;

      // Add data
      rows.forEach((row) => {
        const biaya = row.hrg_satuan * row.volume;
        totalBiaya += biaya;
        sheet.addRow({
          ...row,
          hrg_satuan: row.hrg_satuan,
          biaya,
        });
      });

      // Add total row
      const totalRow = sheet.addRow({
        deskripsi: "Total Biaya Material",
        satuan: "",
        hrg_satuan: "",
        volume: "",
        biaya: totalBiaya,
      });
      totalRow.font = { bold: true };

      // Style cells
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (cell.column === 3 || cell.column === 5) {
            cell.numFmt = '"Rp"#,##0.00';
          }
        });
      });

      resolve();
    });
  });
}

// Add wage sheet
async function addWageSheet(workbook, db) {
  return new Promise((resolve, reject) => {
    const sheet = workbook.addWorksheet("Upah");

    sheet.columns = [
      { header: "Deskripsi", key: "deskripsi", width: 40 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "HRG Satuan", key: "hrg_satuan", width: 15 },
      { header: "Volume", key: "volume", width: 10 },
      { header: "Biaya", key: "biaya", width: 20 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center" };

    const query = `
            SELECT 
                a.ahs as deskripsi,
                a.satuan,
                m.price as hrg_satuan,
                p.koefisien as volume
            FROM ahs a
            LEFT JOIN pricing p ON a.id = p.ahs_id
            LEFT JOIN materials m ON p.material_id = m.id
            WHERE p.koefisien IS NOT NULL
            AND LOWER(m.category) = 'upah'
            ORDER BY a.kelompok, a.kode_ahs
        `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      let totalBiaya = 0;

      // Add data
      rows.forEach((row) => {
        const biaya = row.hrg_satuan * row.volume;
        totalBiaya += biaya;
        sheet.addRow({
          ...row,
          hrg_satuan: row.hrg_satuan,
          biaya,
        });
      });

      // Add total row
      const totalRow = sheet.addRow({
        deskripsi: "Total Biaya Upah",
        satuan: "",
        hrg_satuan: "",
        volume: "",
        biaya: totalBiaya,
      });
      totalRow.font = { bold: true };

      // Style cells
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (cell.column === 3 || cell.column === 5) {
            cell.numFmt = '"Rp"#,##0.00';
          }
        });
      });

      resolve();
    });
  });
}

module.exports = { setupPrintHandlers };
