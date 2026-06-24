const { buildReceiptItemsReport } = require("../../backend/src/services/loyverseService");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Metodo no permitido." });
    return;
  }

  try {
    const { start_date: startDate, end_date: endDate, store_id: storeId, format } = req.query || {};
    const report = await buildReceiptItemsReport({
      startDate,
      endDate,
      storeId
    });

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="recibos-por-articulo-${startDate || "inicio"}-${endDate || "fin"}.csv"`
      );
      res.status(200).send(`\uFEFF${report.csv}`);
      return;
    }

    res.status(200).json({
      rows: report.rows,
      total: report.rows.length
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
};
