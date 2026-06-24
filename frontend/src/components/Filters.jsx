export default function Filters({
  searchTerm,
  activeCategory,
  categoryOptions,
  onSearchChange,
  onCategoryChange
}) {
  return (
    <>
      <section className="toolbar">
        <label className="search">
          <span>Buscar</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nombre, SKU o categoria..."
          />
        </label>

        <label className="filter">
          <span>Categoria</span>
          <select
            value={activeCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="category-strip">
        {categoryOptions.map((category) => (
          <button
            key={category.id}
            className={`category-pill${activeCategory === category.id ? " is-active" : ""}`}
            type="button"
            onClick={() => onCategoryChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </section>
    </>
  );
}
