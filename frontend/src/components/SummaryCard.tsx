type SummaryItem = {
  label: string;
  value: string | number;
};

type SummaryCardProps = {
  title: string;
  items: SummaryItem[];
};

export function SummaryCard({ title, items }: SummaryCardProps) {
  return (
    <section className="surface summary-card">
      <div className="section-title">
        <h2>{title}</h2>
      </div>
      <div className="summary-grid">
        {items.map((item) => (
          <div className="summary-item" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
