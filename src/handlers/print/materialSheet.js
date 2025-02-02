const { STYLES, BORDERS, CURRENCY_FORMAT } = require("./styles");

async function addDetailedMaterialSheet(workbook, db) {
  return new Promise((resolve, reject) => {
    const sheet = workbook.addWorksheet("Material");

    const columns = [
      { header: "Kelompok", key: "kelompok", width: 20 },
      { header: "Kode AHS", key: "kode_ahs", width: 15 },
      { header: "Uraian", key: "uraian", width: 40 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Kuantitas", key: "kuantitas", width: 12 },
      { header: "Harga Satuan", key: "harga", width: 20 },
      { header: "Jumlah", key: "jumlah", width: 20 },
    ];

    sheet.columns = columns;

    // Add report title
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "DAFTAR HARGA BAHAN / MATERIAL";
    titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1A4F7C" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 30;

    // Style header row
    const headerRow = sheet.getRow(2);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      Object.assign(cell, STYLES.header);
      cell.border = BORDERS;
    });

    const query = `
            SELECT 
                a.kelompok,
                a.kode_ahs,
                a.ahs as uraian,
                m.name as material_name,
                a.satuan,
                m.price as harga_satuan,
                p.koefisien as kuantitas
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

      let currentRow = 3;
      let currentKelompok = "";
      let kelompokTotal = 0;
      let grandTotal = 0;

      rows.forEach((row, index) => {
        if (currentKelompok !== row.kelompok) {
          // Add previous kelompok total
          if (currentKelompok !== "") {
            addKelompokTotal(
              sheet,
              currentRow++,
              currentKelompok,
              kelompokTotal
            );
            currentRow++; // Add space between kelompok
          }

          // Add new kelompok header
          currentKelompok = row.kelompok;
          kelompokTotal = 0;

          const kelompokRow = sheet.getRow(currentRow);
          sheet.mergeCells(`A${currentRow}:G${currentRow}`);
          kelompokRow.getCell(1).value = `KELOMPOK: ${currentKelompok}`;
          kelompokRow.height = 25;
          kelompokRow.eachCell((cell) => {
            Object.assign(cell, STYLES.subHeader);
            cell.border = BORDERS;
          });
          currentRow++;
        }

        const biaya = row.harga_satuan * row.kuantitas;
        kelompokTotal += biaya;
        grandTotal += biaya;

        // Add material row
        const dataRow = sheet.getRow(currentRow);
        dataRow.values = [
          row.kelompok,
          row.kode_ahs,
          `${row.uraian}\n${row.material_name}`,
          row.satuan,
          row.kuantitas,
          row.harga_satuan,
          biaya,
        ];
        dataRow.height = 35;
        dataRow.alignment = { wrapText: true };
        dataRow.eachCell((cell, colNumber) => {
          cell.border = BORDERS;
          cell.alignment = { vertical: "middle" };
          if (colNumber === 6 || colNumber === 7) {
            cell.numFmt = CURRENCY_FORMAT;
          }
        });

        currentRow++;

        // Add last kelompok total and grand total
        if (index === rows.length - 1) {
          addKelompokTotal(sheet, currentRow++, currentKelompok, kelompokTotal);
          currentRow += 2;
          addGrandTotal(sheet, currentRow, grandTotal);
        }
      });

      resolve();
    });
  });
}

function addKelompokTotal(sheet, row, kelompok, total) {
  const totalRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:F${row}`);
  totalRow.getCell(1).value = `Total ${kelompok}`;
  totalRow.getCell(7).value = total;
  totalRow.getCell(7).numFmt = CURRENCY_FORMAT;
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    Object.assign(cell, STYLES.totalRow);
    cell.border = BORDERS;
  });
}

function addGrandTotal(sheet, row, total) {
  const totalRow = sheet.getRow(row);
  sheet.mergeCells(`A${row}:F${row}`);
  totalRow.getCell(1).value = "TOTAL BIAYA MATERIAL";
  totalRow.getCell(7).value = total;
  totalRow.getCell(7).numFmt = CURRENCY_FORMAT;
  totalRow.height = 30;
  totalRow.eachCell((cell) => {
    Object.assign(cell, {
      ...STYLES.header,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1A4F7C" },
      },
    });
    cell.border = BORDERS;
  });
}

module.exports = { addDetailedMaterialSheet };
