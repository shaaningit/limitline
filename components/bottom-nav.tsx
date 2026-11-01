"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarSilhouette, BoardIcon, QuestsIcon, ShopIcon } from "./icons";

const TABS = [
  { href: "/quests", label: "Quests", Icon: QuestsIcon },
  { href: "/board", label: "Board", Icon: BoardIcon },
  { href: "/shop", label: "Shop", Icon: ShopIcon },
] as const;

// Always-visible bar, icons only (founder, Nov 1), left to right: Quests, Board, Shop, Profile.
// Each icon keeps its name for screen readers. Profile shows the athlete's photo (from Google
// login) or, without one, a silhouette like Instagram's.
export function BottomNav({ avatarUrl }: { avatarUrl: string | null }) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/profile");
  return (
    <nav className="bottom-nav" aria-label="Main">
      <ul>
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-label={label} aria-current={active ? "page" : undefined}>
                <Icon size={28} filled={active} />
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/profile" aria-label="Profile" aria-current={profileActive ? "page" : undefined}>
            <span className="avatar">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- a small remote photo; next/image would need every photo host configured
                <img src={avatarUrl} alt="" width={28} height={28} referrerPolicy="no-referrer" />
              ) : (
                <AvatarSilhouette size={28} />
              )}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
