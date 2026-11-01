"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/quests", label: "Quests" },
  { href: "/board", label: "Board" },
  { href: "/shop", label: "Shop" },
  { href: "/profile", label: "Profile" },
];

// Always-visible bar, left to right: Quests, Board, Shop, Profile (replaces 1A/15A's 3 tabs).
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
