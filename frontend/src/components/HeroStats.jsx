export default function HeroStats({ stats }) {
  return (
    <div className="hero__stats">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span className="stat__label">{stat.label}</span>
          <strong className="stat__value">{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
