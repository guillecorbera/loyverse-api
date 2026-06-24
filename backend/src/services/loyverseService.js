const axios = require("axios");

const loyverseClient = axios.create({
  baseURL: "https://api.loyverse.com/v1.0"
});

const ITEMS_PAGE_LIMIT = 250;

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${process.env.LOYVERSE_TOKEN}`
  };
}

async function fetchProductsPage(cursor) {
  const response = await loyverseClient.get("/items", {
    headers: getAuthHeaders(),
    params: {
      limit: ITEMS_PAGE_LIMIT,
      ...(cursor ? { cursor } : {})
    }
  });

  return response.data;
}

async function fetchPaginatedCollection(endpoint, key, extraParams = {}) {
  const entries = [];
  let cursor;
  const seenCursors = new Set();

  do {
    const response = await loyverseClient.get(endpoint, {
      headers: getAuthHeaders(),
      params: {
        limit: ITEMS_PAGE_LIMIT,
        ...extraParams,
        ...(cursor ? { cursor } : {})
      }
    });

    entries.push(...(response.data?.[key] || []));
    cursor = response.data?.cursor;

    if (!cursor || seenCursors.has(cursor)) {
      break;
    }

    seenCursors.add(cursor);
  } while (true);

  return { [key]: entries };
}

async function fetchCollection(endpoint, key) {
  const response = await loyverseClient.get(endpoint, {
    headers: getAuthHeaders()
  });

  return response.data?.[key] || [];
}

function toDayStart(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(`${dateString}T00:00:00.000Z`);
}

function toDayEnd(dateString) {
  if (!dateString) {
    return null;
  }

  return new Date(`${dateString}T23:59:59.999Z`);
}

function formatReceiptType(receiptType) {
  switch (receiptType) {
    case "SALE":
      return "Venta";
    case "REFUND":
      return "Reembolso";
    default:
      return receiptType || "";
  }
}

function formatReceiptState(receipt) {
  if (receipt.cancelled_at) {
    return "Cancelado";
  }

  return "Cerrado";
}

function formatReceiptDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  })
    .format(new Date(dateValue))
    .replace(",", "");
}

function formatCustomerContacts(customer) {
  if (!customer) {
    return "";
  }

  return [customer.phone_number, customer.email]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" | ");
}

function formatModifiers(lineItem) {
  return (lineItem.line_modifiers || [])
    .map((modifier) => modifier.name || modifier.modifier_name || "")
    .filter(Boolean)
    .join(", ");
}

function escapeCsvValue(value) {
  const normalizedValue = value ?? "";
  const stringValue =
    typeof normalizedValue === "number" ? normalizedValue.toFixed(2) : String(normalizedValue);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

function toCsv(rows) {
  const headers = [
    "Fecha",
    "Numero de recibo",
    "Tipo de recibo",
    "Categoria",
    "REF",
    "Articulo",
    "Variante",
    "Modificadores aplicados",
    "Cantidad",
    "Ventas brutas",
    "Descuentos",
    "Ventas netas",
    "Costo de los bienes",
    "Beneficio bruto",
    "Impuestos",
    "Tipo de pedido",
    "TPV",
    "Tienda",
    "Nombre del cajero",
    "Nombre del cliente",
    "Contactos del cliente",
    "Comentario",
    "Estado"
  ];

  const lines = rows.map((row) =>
    [
      row.fecha,
      row.numero_de_recibo,
      row.tipo_de_recibo,
      row.categoria,
      row.ref,
      row.articulo,
      row.variante,
      row.modificadores_aplicados,
      row.cantidad,
      row.ventas_brutas,
      row.descuentos,
      row.ventas_netas,
      row.costo_de_los_bienes,
      row.beneficio_bruto,
      row.impuestos,
      row.tipo_de_pedido,
      row.tpv,
      row.tienda,
      row.nombre_del_cajero,
      row.nombre_del_cliente,
      row.contactos_del_cliente,
      row.comentario,
      row.estado
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [headers.join(","), ...lines].join("\n");
}

async function fetchProductById(itemId) {
  const response = await loyverseClient.get(`/items/${itemId}`, {
    headers: getAuthHeaders()
  });

  return response.data;
}

async function fetchProducts() {
  return fetchPaginatedCollection("/items", "items");
}

async function fetchProductBySku(sku) {
  const products = await fetchProducts();
  const normalizedSku = String(sku).trim().toLowerCase();

  const product = (products.items || []).find((item) =>
    (item.variants || []).some(
      (variant) => String(variant.sku || "").trim().toLowerCase() === normalizedSku
    )
  );

  return product || null;
}

async function uploadProductImage(itemId, imageBuffer, contentType) {
  await loyverseClient.post(`/items/${itemId}/image`, imageBuffer, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": contentType
    }
  });

  return { ok: true };
}

async function updateProductItem(itemId, changes) {
  const currentItem = await fetchProductById(itemId);

  const payload = {
    item_name: changes.item_name ?? currentItem.item_name,
    description: changes.description ?? currentItem.description,
    category_id:
      Object.prototype.hasOwnProperty.call(changes, "category_id")
        ? changes.category_id
        : currentItem.category_id,
    track_stock: changes.track_stock ?? currentItem.track_stock,
    sold_by_weight: changes.sold_by_weight ?? currentItem.sold_by_weight,
    reference_id: changes.reference_id ?? currentItem.reference_id
  };

  const response = await loyverseClient.post(`/items/${itemId}`, payload, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });

  return response.data;
}

async function fetchCategories() {
  const response = await loyverseClient.get("/categories", {
    headers: getAuthHeaders()
  });

  return response.data;
}

async function fetchDiscounts() {
  return fetchCollection("/discounts", "discounts");
}

async function fetchEmployees() {
  return fetchCollection("/employees", "employees");
}

async function fetchCustomers() {
  return fetchPaginatedCollection("/customers", "customers");
}

async function fetchInventory() {
  return fetchPaginatedCollection("/inventory", "inventory_levels");
}

async function fetchMerchant() {
  const response = await loyverseClient.get("/merchant", {
    headers: getAuthHeaders()
  });

  return response.data;
}

async function fetchPaymentTypes() {
  return fetchCollection("/payment_types", "payment_types");
}

async function fetchPosDevices() {
  return fetchCollection("/pos_devices", "pos_devices");
}

async function fetchReceipts() {
  return fetchPaginatedCollection("/receipts", "receipts");
}

async function fetchReceiptsByDateRange(startDate, endDate) {
  const params = {};

  if (startDate) {
    params.created_at_min = `${startDate}T00:00:00Z`;
  }

  if (endDate) {
    params.created_at_max = `${endDate}T23:59:59Z`;
  }

  return fetchPaginatedCollection("/receipts", "receipts", params);
}

async function fetchShifts() {
  return fetchPaginatedCollection("/shifts", "shifts");
}

async function fetchStores() {
  return fetchCollection("/stores", "stores");
}

async function fetchSuppliers() {
  return fetchCollection("/suppliers", "suppliers");
}

async function buildReceiptItemsReport({ startDate, endDate, storeId } = {}) {
  const [receiptsResult, itemsResult, categoriesResult, storesResult, posDevicesResult, employeesResult, customersResult] =
    await Promise.allSettled([
      fetchReceiptsByDateRange(startDate, endDate),
      fetchProducts(),
      fetchCategories(),
      fetchStores(),
      fetchPosDevices(),
      fetchEmployees(),
      fetchCustomers()
    ]);

  if (receiptsResult.status !== "fulfilled") {
    throw receiptsResult.reason;
  }

  const receipts = receiptsResult.value.receipts || [];
  const items = itemsResult.status === "fulfilled" ? itemsResult.value.items || [] : [];
  const categories = categoriesResult.status === "fulfilled" ? categoriesResult.value.categories || [] : [];
  const stores = storesResult.status === "fulfilled" ? storesResult.value : [];
  const posDevices = posDevicesResult.status === "fulfilled" ? posDevicesResult.value : [];
  const employees = employeesResult.status === "fulfilled" ? employeesResult.value : [];
  const customers = customersResult.status === "fulfilled" ? customersResult.value.customers || [] : [];

  const startBoundary = toDayStart(startDate);
  const endBoundary = toDayEnd(endDate);

  const itemsById = new Map(items.map((item) => [item.id, item]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const posDevicesById = new Map(posDevices.map((device) => [device.id, device]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));

  const rows = receipts
    .filter((receipt) => {
      const receiptDate = new Date(receipt.receipt_date || receipt.created_at);

      if (Number.isNaN(receiptDate.getTime())) {
        return false;
      }

      if (startBoundary && receiptDate < startBoundary) {
        return false;
      }

      if (endBoundary && receiptDate > endBoundary) {
        return false;
      }

      if (storeId && receipt.store_id !== storeId) {
        return false;
      }

      return true;
    })
    .flatMap((receipt) => {
      const store = storesById.get(receipt.store_id) || null;
      const posDevice = posDevicesById.get(receipt.pos_device_id) || null;
      const employee = employeesById.get(receipt.employee_id) || null;
      const customer = customersById.get(receipt.customer_id) || null;

      return (receipt.line_items || []).map((lineItem, lineIndex) => {
        const item = itemsById.get(lineItem.item_id) || null;
        const category = categoriesById.get(item?.category_id) || null;
        const costTotal = Number(lineItem.cost_total ?? (lineItem.cost || 0) * (lineItem.quantity || 0));
        const grossTotal = Number(lineItem.gross_total_money || 0);
        const netTotal = Number(lineItem.total_money || 0);
        const totalDiscount = Number(lineItem.total_discount || 0);
        const totalTaxes = (lineItem.line_taxes || []).reduce(
          (sum, tax) => sum + Number(tax.money_amount || 0),
          0
        );

        return {
          id: `${receipt.receipt_number || receipt.id || "receipt"}-${lineIndex}`,
          sort_timestamp: new Date(receipt.receipt_date || receipt.created_at || 0).getTime(),
          fecha: formatReceiptDate(receipt.receipt_date || receipt.created_at),
          numero_de_recibo: receipt.receipt_number || "",
          tipo_de_recibo: formatReceiptType(receipt.receipt_type),
          categoria: category?.name || "",
          ref: lineItem.sku || item?.reference_id || "",
          articulo: lineItem.item_name || item?.item_name || "",
          variante: lineItem.variant_name || "",
          modificadores_aplicados: formatModifiers(lineItem),
          cantidad: Number(lineItem.quantity || 0),
          ventas_brutas: grossTotal,
          descuentos: totalDiscount,
          ventas_netas: netTotal,
          costo_de_los_bienes: costTotal,
          beneficio_bruto: netTotal - costTotal,
          impuestos: totalTaxes,
          tipo_de_pedido: receipt.dining_option || "",
          tpv: posDevice?.name || "",
          tienda: store?.name || "",
          nombre_del_cajero: employee?.name || "",
          nombre_del_cliente: customer?.name || "",
          contactos_del_cliente: formatCustomerContacts(customer),
          comentario: [receipt.note, lineItem.line_note].filter(Boolean).join(" | "),
          estado: formatReceiptState(receipt)
        };
      });
    })
    .sort((left, right) => right.sort_timestamp - left.sort_timestamp)
    .map(({ sort_timestamp, ...row }) => row);

  return {
    rows,
    csv: toCsv(rows)
  };
}

module.exports = {
  buildReceiptItemsReport,
  fetchCustomers,
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
  fetchReceiptsByDateRange,
  fetchShifts,
  fetchStores,
  fetchSuppliers,
  fetchCategories,
  updateProductItem,
  uploadProductImage
};
