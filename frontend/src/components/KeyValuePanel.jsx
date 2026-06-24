function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function KeyValuePanel({ data, loading, error }) {
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

  if (!data) {
    return (
      <div className="empty-state">
        <h2>No hay datos para mostrar.</h2>
      </div>
    );
  }

  return (
    <section className="key-grid">
      {Object.entries(data).map(([key, value]) => (
        <article className="key-card" key={key}>
          <span className="key-card__label">{key}</span>
          <pre className="key-card__value">{formatValue(value)}</pre>
        </article>
      ))}
    </section>
  );
}
