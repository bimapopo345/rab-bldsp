function setupPricingHandlers(ipcMain, db) {
  // Add pricing
  ipcMain.on(
    "add-pricing",
    (event, { ahs_id, material_id, quantity, koefisien }) => {
      db.run(
        "INSERT INTO pricing (ahs_id, material_id, quantity, koefisien) VALUES (?, ?, ?, ?)",
        [ahs_id, material_id, quantity, koefisien],
        function (err) {
          if (err) {
            console.error("Error adding pricing:", err);
            event.reply("pricing-added", { error: err.message });
            return;
          }
          event.reply("pricing-added");
        }
      );
    }
  );

  // Get pricing
  ipcMain.on("get-pricing", (event, ahs_id) => {
    db.all(
      `SELECT p.*, m.name, m.unit, m.price 
       FROM pricing p
       JOIN materials m ON p.material_id = m.id
       WHERE p.ahs_id = ?`,
      [ahs_id],
      (err, pricing) => {
        if (err) {
          console.error("Error fetching pricing:", err);
          event.reply("pricing-data", []);
          return;
        }
        event.reply("pricing-data", pricing);
      }
    );
  });

  // Delete pricing
  ipcMain.on("delete-pricing", (event, pricingId) => {
    // First get the AHS ID
    db.get(
      "SELECT ahs_id FROM pricing WHERE id = ?",
      [pricingId],
      (err, pricing) => {
        if (err || !pricing) {
          console.error("Error finding pricing:", err);
          event.reply("pricing-deleted", {
            error: err ? err.message : "Pricing not found",
          });
          return;
        }

        const ahs_id = parseInt(pricing.ahs_id, 10);

        // Delete the pricing entry
        db.run("DELETE FROM pricing WHERE id = ?", [pricingId], (err) => {
          if (err) {
            console.error("Error deleting pricing:", err);
            event.reply("pricing-deleted", { error: err.message });
            return;
          }

          // Get updated pricing data
          db.all(
            `SELECT p.*, m.name, m.unit, m.price
           FROM pricing p
           JOIN materials m ON p.material_id = m.id
           WHERE p.ahs_id = ?`,
            [ahs_id],
            (err, updatedPricing) => {
              if (err) {
                console.error("Error fetching updated pricing:", err);
                event.reply("pricing-data", []);
                return;
              }
              event.reply("pricing-data", updatedPricing);
              event.reply("pricing-deleted");
            }
          );
        });
      }
    );
  });

  // Update pricing
  ipcMain.on("update-pricing", (event, { pricing_id, ahs_id, koefisien }) => {
    db.run(
      "UPDATE pricing SET koefisien = ? WHERE id = ?",
      [koefisien, pricing_id],
      (err) => {
        if (err) {
          console.error("Error updating pricing:", err);
          event.reply("pricing-updated", { error: err.message });
          return;
        }

        // Get updated pricing data
        db.all(
          `SELECT p.*, m.name, m.unit, m.price
           FROM pricing p
           JOIN materials m ON p.material_id = m.id
           WHERE p.ahs_id = ?`,
          [ahs_id],
          (err, updatedPricing) => {
            if (err) {
              console.error("Error fetching updated pricing:", err);
              event.reply("pricing-data", []);
              return;
            }
            event.reply("pricing-data", updatedPricing);
            event.reply("pricing-updated");
          }
        );
      }
    );
  });
}

module.exports = { setupPricingHandlers };
