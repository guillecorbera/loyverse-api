export default function Sidebar({ sections, activeSectionId, onSelectSection }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Loyverse</div>
      <nav className="sidebar__nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`sidebar__link${section.id === activeSectionId ? " is-active" : ""}`}
            type="button"
            onClick={() => onSelectSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
