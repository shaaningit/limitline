import Link from "next/link";
import { Logo } from "@/components/logo";

// Every admin page and action calls requireFounder() itself (server-side admin lock);
// the layout stays static so it can be sent before the session is checked.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin">
      <header style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
          <Logo size={22} /> <span className="num" style={{ fontSize: "var(--text-h2)" }}>admin</span>
        </strong>
        <nav aria-label="Admin" style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          <Link className="button" href="/admin">
            Queue
          </Link>
          <Link className="button" href="/admin/athletes">
            Athletes &amp; seeds
          </Link>
          <Link className="button" href="/admin/shop">
            Shop
          </Link>
          <Link className="button" href="/quests">
            Athlete view
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
