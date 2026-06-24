import { memo, startTransition, useDeferredValue, useMemo, useState } from "react";

const reportColumns = [
  { key: "fecha", label: "Fecha", dateOnly: true },
  { key: "numero_de_recibo", label: "Recibo" },
  { key: "tipo_de_recibo", label: "Tipo" },
  { key: "categoria", label: "Categoria" },
  { key: "ref", label: "REF" },
  { key: "articulo", label: "Articulo" },
  { key: "variante", label: "Variante" },
  { key: "cantidad", label: "Cantidad", numeric: true },
  { key: "ventas_brutas", label: "Ventas brutas", numeric: true, currency: true },
  { key: "descuentos", label: "Descuentos", numeric: true, currency: true },
  { key: "ventas_netas", label: "Ventas netas", numeric: true, currency: true },
  { key: "beneficio_bruto", label: "Beneficio bruto", numeric: true, currency: true },
  { key: "impuestos", label: "Impuestos", numeric: true, currency: true },
  { key: "tipo_de_pedido", label: "Pedido" },
  { key: "tpv", label: "TPV" },
  { key: "tienda", label: "Tienda" },
  { key: "nombre_del_cajero", label: "Cajero" },
  { key: "nombre_del_cliente", label: "Cliente" },
  { key: "estado", label: "Estado" }
];

function formatDateForInput(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultFilters() {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 30);

  return {
    startDate: formatDateForInput(monthAgo),
    endDate: formatDateForInput(today)
  };
}

function formatCellValue(value, numeric) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (numeric) {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value));
  }

  return String(value);
}

function formatDisplayDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "—";
  }

  const [datePart = ""] = raw.split(" ");
  const [day = "", month = "", year = ""] = datePart.split("/");

  if (!day || !month || !year) {
    return datePart || raw;
  }

  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${normalizedYear}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compareValues(left, right, numeric) {
  if (numeric) {
    return Number(left || 0) - Number(right || 0);
  }

  return String(left || "").localeCompare(String(right || ""), "es", {
    numeric: true,
    sensitivity: "base"
  });
}

export default function ReceiptItemsReport() {
  const defaults = useMemo(() => getDefaultFilters(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [sortKey, setSortKey] = useState("fecha");
  const [sortDirection, setSortDirection] = useState("desc");
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    reportColumns.map((column) => column.key)
  );
  const deferredRows = useDeferredValue(rows);
  const deferredCategoryFilter = useDeferredValue(categoryFilter);
  const deferredArticleFilter = useDeferredValue(articleFilter);
  const deferredReferenceFilter = useDeferredValue(referenceFilter);
  const deferredSortKey = useDeferredValue(sortKey);
  const deferredSortDirection = useDeferredValue(sortDirection);
  const deferredVisibleColumnKeys = useDeferredValue(visibleColumnKeys);

  async function loadReport(nextStartDate, nextEndDate) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        start_date: nextStartDate,
        end_date: nextEndDate
      });
      const response = await fetch(`/api/reportes/recibos-por-articulo?${params.toString()}`);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "No se pudo cargar el informe.");
      }

      const data = await response.json();
      setRows(data.rows || []);
      setHasLoaded(true);
    } catch (loadError) {
      setError(loadError.message);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = useMemo(
    () =>
      [...new Set(deferredRows.map((row) => row.categoria).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
      ),
    [deferredRows]
  );
  const articleOptions = useMemo(
    () =>
      [...new Set(deferredRows.map((row) => row.articulo).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
      ),
    [deferredRows]
  );

  const filteredRows = useMemo(() => {
    const normalizedArticle = deferredArticleFilter.trim().toLowerCase();
    const normalizedReference = deferredReferenceFilter.trim().toLowerCase();

    return deferredRows.filter((row) => {
      if (deferredCategoryFilter && row.categoria !== deferredCategoryFilter) {
        return false;
      }

      if (
        normalizedArticle &&
        !String(row.articulo ?? "")
          .toLowerCase()
          .includes(normalizedArticle)
      ) {
        return false;
      }

      if (
        normalizedReference &&
        !String(row.ref ?? "")
          .toLowerCase()
          .includes(normalizedReference)
      ) {
        return false;
      }

      return true;
    });
  }, [deferredRows, deferredCategoryFilter, deferredArticleFilter, deferredReferenceFilter]);

  const sortedRows = useMemo(() => {
    const column = reportColumns.find((entry) => entry.key === deferredSortKey);
    const direction = deferredSortDirection === "asc" ? 1 : -1;

    return [...filteredRows].sort(
      (left, right) =>
        compareValues(left[deferredSortKey], right[deferredSortKey], column?.numeric) * direction
    );
  }, [filteredRows, deferredSortKey, deferredSortDirection]);

  const summaryNetSales = useMemo(
    () => sortedRows.reduce((sum, row) => sum + Number(row.ventas_netas || 0), 0),
    [sortedRows]
  );
  const activeSortLabel =
    reportColumns.find((option) => option.key === deferredSortKey)?.label || "Fecha";
  const visibleColumns = useMemo(
    () => reportColumns.filter((column) => deferredVisibleColumnKeys.includes(column.key)),
    [deferredVisibleColumnKeys]
  );

  function toggleColumn(columnKey) {
    startTransition(() => {
      setVisibleColumnKeys((currentKeys) => {
        if (currentKeys.includes(columnKey)) {
          if (currentKeys.length === 1) {
            return currentKeys;
          }

          return currentKeys.filter((key) => key !== columnKey);
        }

        return reportColumns
          .map((column) => column.key)
          .filter((key) => currentKeys.includes(key) || key === columnKey);
      });
    });
  }

  function handleSort(column) {
    if (sortKey === column.key) {
      startTransition(() => {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
      });
      return;
    }

    startTransition(() => {
      setSortKey(column.key);
      setSortDirection(column.numeric ? "desc" : "asc");
    });
  }

  function openPrintPreview() {
    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      return;
    }

    const tableHeaders = visibleColumns
      .map(
        (column) =>
          `<th>${escapeHtml(column.label)}</th>`
      )
      .join("");

    const tableRows = sortedRows
      .map((row) => {
        const cells = visibleColumns
          .map((column) => {
            const value = column.dateOnly
              ? formatDisplayDate(row[column.key])
              : column.currency
                ? formatCurrency(row[column.key])
                : formatCellValue(row[column.key], column.numeric);

            return `<td>${escapeHtml(value)}</td>`;
          })
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Informe de Ventas por Articulo</title>
    <style>
      body {
        margin: 0;
        padding: 24px;
        font-family: Manrope, Arial, sans-serif;
        color: #1d1d1d;
        background: #ffffff;
      }
      .report {
        max-width: 1400px;
        margin: 0 auto;
      }
      .report__title {
        margin: 0 0 6px;
        font-size: 26px;
        font-weight: 800;
      }
      .report__meta {
        margin: 0 0 18px;
        font-size: 14px;
        color: #5f5f5f;
      }
      .report__summary {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }
      .report__pill {
        padding: 10px 14px;
        border-radius: 10px;
        background: #eef3fb;
        font-size: 13px;
      }
      .report__table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        min-width: 1100px;
        border-collapse: collapse;
        font-size: 12px;
      }
      th, td {
        padding: 7px 9px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #d9e2f3;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      tbody tr:nth-child(odd) {
        background: #f7f9fc;
      }
      tbody tr:nth-child(even) {
        background: #eaf0fb;
      }
      .report__actions {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-bottom: 16px;
        background: #fff;
      }
      .report__button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        background: #1c7c68;
        color: #fff;
      }
      .report__button--secondary {
        background: #e7ecf4;
        color: #334155;
      }
      @media print {
        body {
          padding: 0;
        }
        .report__actions {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="report">
      <div class="report__actions">
        <button class="report__button report__button--secondary" onclick="window.close()">Cerrar</button>
        <button class="report__button" onclick="window.print()">Imprimir o Guardar PDF</button>
      </div>
      <h1 class="report__title">Informe de Ventas por Articulo</h1>
      <p class="report__meta">Periodo: ${escapeHtml(startDate)} a ${escapeHtml(endDate)}</p>
      <div class="report__summary">
        <div class="report__pill">Lineas: ${escapeHtml(sortedRows.length)}</div>
        <div class="report__pill">Ventas netas: ${escapeHtml(formatCurrency(summaryNetSales))}</div>
        <div class="report__pill">Orden: ${escapeHtml(activeSortLabel)} ${escapeHtml(sortDirection === "asc" ? "ascendente" : "descendente")}</div>
      </div>
      <div class="report__table-wrap">
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="${visibleColumns.length}">No hay datos para los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  </body>
</html>`;

    previewWindow.document.open("text/html", "replace");
    previewWindow.document.write(html);
    previewWindow.document.close();
    previewWindow.focus();
  }

  return (
    <section className="report-shell">
      <div className="report-toolbar">
        <div className="report-toolbar__filters report-toolbar__filters--compact">
          <label className="filter-card">
            <span>Desde</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="filter-card">
            <span>Hasta</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>

        <div className="report-toolbar__actions">
          <button
            className="primary-button report-action"
            type="button"
            onClick={() => void loadReport(startDate, endDate)}
            disabled={loading || !startDate || !endDate}
          >
            {loading ? "Consultando..." : "Consultar ventas"}
          </button>
        </div>
      </div>

      {!hasLoaded ? (
        <div className="empty-state">
          <h2>Selecciona el periodo del informe.</h2>
          <p>Primero indica las fechas desde y hasta, y luego pulsa "Consultar ventas".</p>
        </div>
      ) : null}

      {error ? (
        <div className="empty-state">
          <h2>No se pudo cargar el informe.</h2>
          <p>{error}</p>
        </div>
      ) : null}

      {hasLoaded && !error ? (
        <>
          <section className="print-report-header" aria-hidden="true">
            <h2 className="print-report-header__title">Informe de Ventas por Articulo</h2>
            <p className="print-report-header__meta">
              Periodo: {startDate} a {endDate}
            </p>
          </section>

          <div className="report-filters-panel">
            <div className="report-filters-panel__grid">
              <label className="filter-card">
                <span>Categoria</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => {
                    const { value } = event.target;
                    startTransition(() => setCategoryFilter(value));
                  }}
                >
                  <option value="">Todas</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-card">
                <span>Articulo</span>
                <input
                  list="article-options"
                  type="search"
                  value={articleFilter}
                  onChange={(event) => {
                    const { value } = event.target;
                    startTransition(() => setArticleFilter(value));
                  }}
                  placeholder="Nombre del articulo..."
                />
                <datalist id="article-options">
                  {articleOptions.map((article) => (
                    <option key={article} value={article} />
                  ))}
                </datalist>
              </label>

              <label className="filter-card">
                <span>Referencia</span>
                <input
                  type="search"
                  value={referenceFilter}
                  onChange={(event) => {
                    const { value } = event.target;
                    startTransition(() => setReferenceFilter(value));
                  }}
                  placeholder="REF o SKU..."
                />
              </label>

              <div className="filter-card filter-card--columns">
                <span>Columnas del informe</span>
                <div className="column-selector">
                  {reportColumns.map((column) => (
                    <label key={column.key} className="column-selector__item">
                      <input
                        type="checkbox"
                        checked={visibleColumnKeys.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                      />
                      <span>{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="report-toolbar__actions report-toolbar__actions--filters">
                <button
                  className="report-action report-action--pdf"
                  type="button"
                  onClick={openPrintPreview}
                >
                  Vista previa PDF
                </button>
              </div>
            </div>
          </div>

          <div className="report-summary">
            <div className="key-card">
              <span className="key-card__label">Lineas</span>
              <p className="key-card__value">{sortedRows.length}</p>
            </div>

            <div className="key-card">
              <span className="key-card__label">Ventas netas</span>
              <p className="key-card__value">{formatCurrency(summaryNetSales)}</p>
            </div>

            <div className="key-card">
              <span className="key-card__label">Orden actual</span>
              <p className="key-card__value">
                {activeSortLabel} {sortDirection === "asc" ? "ascendente" : "descendente"}
              </p>
            </div>
          </div>

          <label className="filter-card filter-card--status">
            <span>Filtros activos</span>
            <input
              type="text"
              readOnly
              value={`Periodo: ${startDate} a ${endDate} | Categoria: ${categoryFilter || "Todas"} | Articulo: ${articleFilter || "Todos"} | Referencia: ${referenceFilter || "Todas"} | Orden: ${activeSortLabel} ${sortDirection === "asc" ? "ascendente" : "descendente"}`}
            />
          </label>

          <div className="resource-table-wrap">
            <table className="resource-table">
              <thead>
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column.key}>
                      <button
                        className="table-sort-button"
                        type="button"
                        onClick={() => handleSort(column)}
                      >
                        {column.label}
                        <span className="table-sort-button__icon">
                          {sortKey === column.key ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="resource-table__empty">
                      Cargando informe...
                    </td>
                  </tr>
                ) : sortedRows.length ? (
                  <ReportRows rows={sortedRows} columns={visibleColumns} />
                ) : (
                  <tr>
                    <td colSpan={visibleColumns.length} className="resource-table__empty">
                      No hay datos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

const ReportRows = memo(function ReportRows({ rows, columns }) {
  return rows.map((row) => (
    <tr key={row.id}>
      {columns.map((column) => (
        <td key={`${row.id}-${column.key}`}>
          {column.dateOnly
            ? formatDisplayDate(row[column.key])
            : column.currency
              ? formatCurrency(row[column.key])
              : formatCellValue(row[column.key], column.numeric)}
        </td>
      ))}
    </tr>
  ));
});
