const express = require("express");
const {
  buildReceiptItemsReport,
  fetchDiscounts,
  fetchEmployees,
  fetchInventory,
  fetchMerchant,
  fetchPaymentTypes,
  fetchProductById,
  fetchProductBySku,
  fetchProducts,
  fetchPosDevices,
  fetchReceipts,
  fetchShifts,
  fetchStores,
  fetchSuppliers,
  fetchCategories,
  updateProductItem,
  uploadProductImage
} = require("../services/loyverseService");

const router = express.Router();

router.get("/productos", async (_req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/productos/sku/:sku", async (req, res) => {
  try {
    const product = await fetchProductBySku(req.params.sku);

    if (!product) {
      return res.status(404).json({
        message: `No se encontro ningun producto con el SKU ${req.params.sku}.`
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/productos/:itemId", async (req, res) => {
  try {
    const product = await fetchProductById(req.params.itemId);
    res.json(product);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.put("/productos/:itemId", async (req, res) => {
  try {
    const {
      item_name,
      description,
      category_id,
      track_stock,
      sold_by_weight,
      reference_id
    } = req.body || {};

    if (item_name !== undefined && !String(item_name).trim()) {
      return res.status(400).json({
        message: "El nombre del item no puede estar vacio."
      });
    }

    const updatedProduct = await updateProductItem(req.params.itemId, {
      item_name,
      description,
      category_id,
      track_stock,
      sold_by_weight,
      reference_id
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/categorias", async (_req, res) => {
  try {
    const categories = await fetchCategories();
    res.json(categories);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/discounts", async (_req, res) => {
  try {
    const discounts = await fetchDiscounts();
    res.json({ discounts });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/employees", async (_req, res) => {
  try {
    const employees = await fetchEmployees();
    res.json({ employees });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/inventory", async (_req, res) => {
  try {
    const inventory = await fetchInventory();
    res.json(inventory);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/merchant", async (_req, res) => {
  try {
    const merchant = await fetchMerchant();
    res.json(merchant);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/payment-types", async (_req, res) => {
  try {
    const paymentTypes = await fetchPaymentTypes();
    res.json({ payment_types: paymentTypes });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/pos-devices", async (_req, res) => {
  try {
    const posDevices = await fetchPosDevices();
    res.json({ pos_devices: posDevices });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/receipts", async (_req, res) => {
  try {
    const receipts = await fetchReceipts();
    res.json(receipts);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/reportes/recibos-por-articulo", async (req, res) => {
  try {
    const { start_date: startDate, end_date: endDate, store_id: storeId, format } = req.query;
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
      res.send(`\uFEFF${report.csv}`);
      return;
    }

    res.json({
      rows: report.rows,
      total: report.rows.length
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/shifts", async (_req, res) => {
  try {
    const shifts = await fetchShifts();
    res.json(shifts);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/stores", async (_req, res) => {
  try {
    const stores = await fetchStores();
    res.json({ stores });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.get("/suppliers", async (_req, res) => {
  try {
    const suppliers = await fetchSuppliers();
    res.json({ suppliers });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

router.post("/productos/:itemId/imagen", async (req, res) => {
  try {
    const { contentType, imageBase64 } = req.body || {};

    if (!contentType || !imageBase64) {
      return res.status(400).json({
        message: "Debes enviar contentType e imageBase64."
      });
    }

    if (contentType !== "image/png") {
      return res.status(400).json({
        message: "Por ahora solo se permiten imagenes PNG."
      });
    }

    const imageBuffer = Buffer.from(imageBase64, "base64");

    await uploadProductImage(req.params.itemId, imageBuffer, contentType);

    res.status(201).json({
      ok: true,
      message: "Imagen subida correctamente."
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json(error.response?.data || { message: error.message });
  }
});

module.exports = router;
