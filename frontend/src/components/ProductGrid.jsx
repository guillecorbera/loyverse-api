const categoryColors = {
  GREY: { bg: "#efe7dd", text: "#5c4836" },
  ORANGE: { bg: "#ffe7d6", text: "#a24b16" },
  LIME: { bg: "#e5f3d4", text: "#4f6b1c" },
  GREEN: { bg: "#d7efe2", text: "#16563d" },
  RED: { bg: "#f7d9d6", text: "#8d241c" },
  BLUE: { bg: "#d9ebf8", text: "#1f557e" },
  PINK: { bg: "#f7dceb", text: "#8d2965" },
  PURPLE: { bg: "#e7def8", text: "#573294" },
  YELLOW: { bg: "#fbefc8", text: "#806100" }
};

function formatPrice(value) {
  if (typeof value !== "number") {
    return "Precio no disponible";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatDate(value) {
  if (!value) {
    return "sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function ProductGrid({
  products,
  loading,
  error,
  categories,
  editingItemId,
  uploadingItemId,
  savingItemId,
  onEditItem,
  onUploadImage,
  onUpdateItem
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <h2>Cargando catalogo...</h2>
        <p>Estamos preparando productos y categorias.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>No se pudo cargar el catalogo.</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="empty-state">
        <h2>No hay resultados para este filtro.</h2>
        <p>Prueba con otra categoria o cambia el texto de busqueda.</p>
      </div>
    );
  }

  return (
    <section className="catalog">
      {products.map((product) => {
        const colors = categoryColors[product.categoryColor] || categoryColors.GREY;
        const isEditing = editingItemId === product.id;

        return (
          <article className="product-card" key={product.id}>
            <div className="product-card__media">
              {product.imageUrl ? (
                <img
                  className="product-card__image is-visible"
                  src={product.imageUrl}
                  alt={product.name}
                />
              ) : (
                <div className="product-card__placeholder">
                  <span>Sin imagen</span>
                </div>
              )}
            </div>

            <div className="product-card__body">
              <div className="product-card__topline">
                <span
                  className="product-card__category"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text
                  }}
                >
                  {product.categoryName}
                </span>
                <span className="product-card__price">{formatPrice(product.price)}</span>
              </div>

              <h2 className="product-card__title">{product.name}</h2>
              <p className="product-card__meta">
                SKU {product.sku} · Actualizado {formatDate(product.updatedAt)}
              </p>

              <div className="product-card__chips">
                <span className="chip">
                  {product.available ? "Disponible" : "No disponible"}
                </span>
                <span className="chip">
                  {product.soldByWeight ? "Venta por peso" : "Precio fijo"}
                </span>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() => onEditItem(isEditing ? "" : product.id)}
              >
                {isEditing ? "Cerrar edicion" : "Editar item"}
              </button>

              {!product.imageUrl ? (
                <label className="upload-control">
                  <span className="upload-control__label">
                    {uploadingItemId === product.id ? "Subiendo imagen..." : "Cargar imagen"}
                  </span>
                  <input
                    type="file"
                    accept="image/png"
                    disabled={uploadingItemId === product.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      onUploadImage(product, file);
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : null}

              {isEditing ? (
                <EditItemForm
                  product={product}
                  categories={categories}
                  saving={savingItemId === product.id}
                  onCancel={() => onEditItem("")}
                  onSave={(values) => onUpdateItem(product.id, values)}
                />
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function EditItemForm({ product, categories, saving, onCancel, onSave }) {
  return (
    <form
      className="edit-form"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        onSave({
          item_name: String(formData.get("item_name") || "").trim(),
          description: String(formData.get("description") || "").trim(),
          category_id:
            formData.get("category_id") === "uncategorized"
              ? null
              : formData.get("category_id") || null,
          reference_id: String(formData.get("reference_id") || "").trim() || null,
          track_stock: formData.get("track_stock") === "on",
          sold_by_weight: formData.get("sold_by_weight") === "on"
        });
      }}
    >
      <label className="form-field">
        <span>Nombre</span>
        <input defaultValue={product.name} name="item_name" required />
      </label>

      <label className="form-field">
        <span>Descripcion</span>
        <textarea defaultValue={product.description} name="description" rows="3" />
      </label>

      <label className="form-field">
        <span>Categoria</span>
        <select defaultValue={product.categoryId} name="category_id">
          <option value="uncategorized">Sin categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Referencia</span>
        <input defaultValue={product.referenceId} name="reference_id" />
      </label>

      <label className="check-field">
        <input defaultChecked={product.trackStock} name="track_stock" type="checkbox" />
        <span>Controlar stock</span>
      </label>

      <label className="check-field">
        <input defaultChecked={product.soldByWeight} name="sold_by_weight" type="checkbox" />
        <span>Venta por peso</span>
      </label>

      <div className="edit-form__actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
