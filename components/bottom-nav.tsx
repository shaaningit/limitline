"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/quests", label: "Quests" },
  { href: "/board", label: "Board" },
  { href: "/shop", label: "Shop" },
];

// Always-visible bar with 3 tabs (design 1A, 15A keeps it at 3).
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      <ul>
        {TABS.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} aria-current={pathname.startsWith(tab.href) ? "page" : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
