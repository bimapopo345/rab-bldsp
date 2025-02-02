function setupCalculatorHandlers(ipcMain, db) {
  // Get summary data for all work items
  ipcMain.on("get-summary-data", (event) => {
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
            ORDER BY a.kelompok, a.kode_ahs
        `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching summary data:", err);
        event.reply("summary-data", []);
        return;
      }
      event.reply("summary-data", rows);
    });
  });

  // Get detailed data grouped by AHS category
  ipcMain.on("get-detail-data", (event) => {
    const query = `
            SELECT 
                a.kelompok,
                a.ahs as deskripsi,
                a.satuan,
                m.price as hrg_satuan,
                p.koefisien as volume
            FROM ahs a
            LEFT JOIN pricing p ON a.id = p.ahs_id
            LEFT JOIN materials m ON p.material_id = m.id
            WHERE p.koefisien IS NOT NULL
            ORDER BY a.kelompok, a.kode_ahs
        `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching detail data:", err);
        event.reply("detail-data", {});
        return;
      }

      // Group the results by kelompok
      const groupedData = rows.reduce((acc, row) => {
        const kelompok = row.kelompok;
        if (!acc[kelompok]) {
          acc[kelompok] = [];
        }
        // Remove kelompok from individual row data
        const { kelompok: _, ...rowWithoutKelompok } = row;
        acc[kelompok].push(rowWithoutKelompok);
        return acc;
      }, {});

      event.reply("detail-data", groupedData);
    });
  });
}

module.exports = { setupCalculatorHandlers };
