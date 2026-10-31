// Loading state: grey placeholder rows (design 4A). Sent immediately while data loads.
export function PlaceholderRows({ count = 4, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="rows" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <span style={{ display: "block", height: 16, width: `${60 - i * 8}%`, background: "var(--surface)", borderRadius: 4 }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
