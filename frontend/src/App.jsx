import { useEffect, useState } from "react";
import KeyValuePanel from "./components/KeyValuePanel";
import ProductGrid from "./components/ProductGrid";
import ReceiptItemsReport from "./components/ReceiptItemsReport";
import ResourceTable from "./components/ResourceTable";

const sections = [
  { id: "items", label: "Productos", type: "items" },
  {
    id: "receipt-items-report",
    label: "Informe de Ventas",
    type: "component",
    component: ReceiptItemsReport
  },
  {
    id: "categories",
    label: "Categorias",
    path: "/api/categorias",
    responseKey: "categories",
    type: "list",
    columns: ["name", "color", "created_at"]
  },
  {
    id: "discounts",
    label: "Descuentos",
    path: "/api/discounts",
    responseKey: "discounts",
    type: "list",
    columns: ["name", "type", "discount_percent", "discount_amount", "created_at"]
  },
  {
    id: "employees",
    label: "Empleados",
    path: "/api/employees",
    responseKey: "employees",
    type: "list",
    columns: ["name", "email", "phone_number", "role", "store_id"]
  },
  {
    id: "inventory",
    label: "Inventario",
    path: "/api/inventory",
    responseKey: "inventory_levels",
    type: "list",
    columns: ["variant_id", "store_id", "in_stock", "updated_at"]
  },
  {
    id: "merchant",
    label: "Comercio",
    path: "/api/merchant",
    type: "object"
  },
  {
    id: "payment-types",
    label: "Tipos de pago",
    path: "/api/payment-types",
    responseKey: "payment_types",
    type: "list",
    columns: ["name", "type", "stores", "updated_at"]
  },
  {
    id: "pos-devices",
    label: "TPV",
    path: "/api/pos-devices",
    responseKey: "pos_devices",
    type: "list",
    columns: ["name", "store_id", "created_at", "updated_at"]
  },
  {
    id: "receipts",
    label: "Recibos",
    path: "/api/receipts",
    responseKey: "receipts",
    type: "list",
    columns: ["receipt_number", "receipt_type", "total_money", "store_id", "receipt_date"]
  },
  {
    id: "shifts",
    label: "Turnos",
    path: "/api/shifts",
    responseKey: "shifts",
    type: "list",
    columns: ["id", "store_id", "opened_at", "closed_at", "gross_sales"]
  },
  {
    id: "stores",
    label: "Tiendas",
    path: "/api/stores",
    responseKey: "stores",
    type: "list",
    columns: ["name", "city", "country_code", "phone_number", "created_at"]
  },
  {
    id: "suppliers",
    label: "Proveedores",
    path: "/api/suppliers",
    responseKey: "suppliers",
    type: "list",
    columns: ["name", "contact", "email", "phone_number", "city"]
  }
];
export default function App() {
  const [activeSectionId, setActiveSectionId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceRows, setResourceRows] = useState([]);
  const [resourceObject, setResourceObject] = useState(null);
  const [uploadingItemId, setUploadingItemId] = useState("");
  const [savingItemId, setSavingItemId] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [notice, setNotice] = useState("");

  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];
  const isMenuView = !activeSectionId;

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSection() {
      if (isMenuView) {
        setLoading(false);
        setError("");
        setNotice("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setNotice("");

        if (activeSection.type === "items") {
          const { orderedCategories, normalizedProducts } = await fetchCatalogData();

          if (!cancelled) {
            setCategories(orderedCategories);
            setProducts(normalizedProducts);
            setResourceRows([]);
            setResourceObject(null);
          }
          return;
        }

        if (activeSection.type === "component") {
          if (!cancelled) {
            setResourceRows([]);
            setResourceObject(null);
          }
          return;
        }

        const response = await fetch(activeSection.path);

        if (!response.ok) {
          throw new Error("No se pudieron cargar los datos.");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (activeSection.type === "object") {
          setResourceObject(data);
          setResourceRows([]);
        } else {
          setResourceRows(data[activeSection.responseKey] || []);
          setResourceObject(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActiveSection();

    return () => {
      cancelled = true;
    };
  }, [activeSection.path, activeSection.type, activeSection.responseKey, isMenuView]);

  async function handleImageUpload(product, file) {
    if (!file) {
      return;
    }

    try {
      setUploadingItemId(product.id);
      setNotice("");

      const imageBase64 = await readFileAsBase64(file);
      const response = await fetch(`/api/productos/${product.id}/imagen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentType: file.type || "image/png",
          imageBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo subir la imagen.");
      }

      const { orderedCategories, normalizedProducts } = await fetchCatalogData();
      setCategories(orderedCategories);
      setProducts(normalizedProducts);
      setNotice(`Imagen actualizada para ${product.name}.`);
    } catch (uploadError) {
      setNotice(uploadError.message);
    } finally {
      setUploadingItemId("");
    }
  }

  async function handleUpdateItem(productId, formValues) {
    try {
      setSavingItemId(productId);
      setNotice("");

      const response = await fetch(`/api/productos/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formValues)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo actualizar el item.");
      }

      const { orderedCategories, normalizedProducts } = await fetchCatalogData();
      setCategories(orderedCategories);
      setProducts(normalizedProducts);
      setEditingItemId("");
      setNotice("Item actualizado correctamente.");
    } catch (saveError) {
      setNotice(saveError.message);
    } finally {
      setSavingItemId("");
    }
  }

  const filteredProducts = products.filter((product) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    const haystack =
      `${product.name} ${product.sku} ${product.categoryName} ${product.referenceId}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const filteredRows = resourceRows.filter((row) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return JSON.stringify(row).toLowerCase().includes(normalizedSearch);
  });

  const counts = countProductsByCategory(products);
  const itemCategories = categories.map((category) => ({
    ...category,
    total: counts.get(category.id) || 0
  }));

  return (
    <div className={`dashboard-shell${isMenuView ? " dashboard-shell--menu" : ""}`}>
      <main className="content-panel">
        {isMenuView ? (
          <section className="access-menu">
            <div className="access-menu__hero">
              <p className="access-menu__eyebrow">Loyverse</p>
              <h1 className="section-title">Panel de acceso</h1>
              <p className="section-meta">
                Elige si quieres trabajar con el catalogo o con los recibos.
              </p>
            </div>

            <div className="access-grid">
              <button
                type="button"
                className="access-card access-card--catalog access-card--disabled"
                disabled
              >
                <span className="access-card__kicker">Catalogo</span>
                <strong className="access-card__title">Productos y fichas</strong>
                <span className="access-card__copy">
                  Esta seccion queda pausada de momento. Volveremos a ella mas adelante.
                </span>
              </button>

              <button
                type="button"
                className="access-card access-card--receipts"
                onClick={() => {
                  setActiveSectionId("receipt-items-report");
                  setSearchTerm("");
                  setEditingItemId("");
                }}
              >
                <span className="access-card__kicker">Recibos</span>
                <strong className="access-card__title">Informe de Ventas</strong>
                <span className="access-card__copy">
                  Consulta ventas, filtra localmente y prepara la impresion del informe.
                </span>
              </button>
            </div>
          </section>
        ) : (
          <>
        <header className="content-toolbar">
          <div>
            <h1 className="section-title">{activeSection.label}</h1>
            <p className="section-meta">
              {activeSection.type === "items"
                ? `${filteredProducts.length} resultados`
                : activeSection.type === "component"
                  ? "Consulta, ordena, filtra y prepara el informe para impresion"
                : activeSection.type === "object"
                  ? "Resumen del recurso"
                  : `${filteredRows.length} resultados`}
            </p>
          </div>

          <div className="content-toolbar__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setActiveSectionId("");
                setSearchTerm("");
                setEditingItemId("");
                setNotice("");
              }}
            >
              Volver al menu
            </button>

            {activeSection.type === "component" ? null : (
              <label className="search search--compact">
                <span>Buscar</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={`Buscar en ${activeSection.label.toLowerCase()}...`}
                />
              </label>
            )}
          </div>
        </header>

        {notice ? <p className="upload-banner">{notice}</p> : null}

        {activeSection.type === "items" ? (
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            error={error}
            categories={itemCategories}
            editingItemId={editingItemId}
            uploadingItemId={uploadingItemId}
            savingItemId={savingItemId}
            onEditItem={setEditingItemId}
            onUploadImage={handleImageUpload}
            onUpdateItem={handleUpdateItem}
          />
        ) : activeSection.type === "component" ? (
          <activeSection.component />
        ) : activeSection.type === "object" ? (
          <KeyValuePanel data={resourceObject} loading={loading} error={error} />
        ) : (
          <ResourceTable
            title={activeSection.label}
            rows={filteredRows}
            columns={activeSection.columns}
            loading={loading}
            error={error}
          />
        )}
          </>
        )}
      </main>
    </div>
  );
}

async function fetchCatalogData() {
  const [productsRes, categoriesRes] = await Promise.all([
    fetch("/api/productos"),
    fetch("/api/categorias")
  ]);

  if (!productsRes.ok || !categoriesRes.ok) {
    throw new Error("No se pudieron cargar los datos del catalogo.");
  }

  const productsData = await productsRes.json();
  const categoriesData = await categoriesRes.json();
  const orderedCategories = (categoriesData.categories || []).sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
  const categoryById = new Map(orderedCategories.map((category) => [category.id, category]));

  const normalizedProducts = (productsData.items || []).map((product) => {
    const category = categoryById.get(product.category_id) || null;
    const variant = product.variants?.[0] || null;
    const store = variant?.stores?.[0] || null;

    return {
      id: product.id,
      name: product.item_name,
      imageUrl: product.image_url,
      sku: variant?.sku || "Sin SKU",
      price: store?.price ?? variant?.default_price ?? null,
      categoryId: category?.id || "uncategorized",
      categoryName: category?.name || "Sin categoria",
      categoryColor: category?.color || "GREY",
      available: store?.available_for_sale !== false,
      description: product.description || "",
      referenceId: product.reference_id || "",
      soldByWeight: Boolean(product.sold_by_weight),
      trackStock: Boolean(product.track_stock),
      updatedAt: product.updated_at
    };
  });

  return {
    orderedCategories,
    normalizedProducts
  };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64 = ""] = result.split(",");
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("No se pudo leer el archivo seleccionado."));
    };

    reader.readAsDataURL(file);
  });
}

function countProductsByCategory(products) {
  return products.reduce((counts, product) => {
    const currentTotal = counts.get(product.categoryId) || 0;
    counts.set(product.categoryId, currentTotal + 1);
    return counts;
  }, new Map());
}
