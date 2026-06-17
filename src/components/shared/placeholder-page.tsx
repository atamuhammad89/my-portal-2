type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-xl border p-8 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted-text)]">{description}</p>
    </section>
  );
}
