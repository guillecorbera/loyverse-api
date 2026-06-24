function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  return value;
}

function humanizeColumn(column) {
  return column.replace(/_/g, " ");
}

export default function ResourceTable({ rows, columns, loading, error }) {
  if (loading) {
    return (
      <div className="empty-state">
        <h2>Cargando datos...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>No se pudo cargar esta seccion.</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="empty-state">
        <h2>No hay datos para mostrar.</h2>
      </div>
    );
  }

  const visibleColumns =
    columns?.filter((column) => rows.some((row) => Object.hasOwn(row, column))) ||
    [];
  const finalColumns =
    visibleColumns.length > 0 ? visibleColumns : Object.keys(rows[0] || {}).slice(0, 6);

  return (
    <div className="resource-table-wrap">
      <table className="resource-table">
        <thead>
          <tr>
            {finalColumns.map((column) => (
              <th key={column}>{humanizeColumn(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={
                row.id ||
                row.receipt_number ||
                row.variant_id ||
                `${index}-${finalColumns[0] || "row"}`
              }
            >
              {finalColumns.map((column) => (
                <td key={`${row.id || index}-${column}`}>{formatCellValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
