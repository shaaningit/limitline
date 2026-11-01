import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";

export default function AthleteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="app-bar">
        <Link href="/quests" aria-label="LIMITLINE, go to My quests" style={{ textDecoration: "none" }}>
          <Logo size={20} />
        </Link>
      </header>
      <main className="page">{children}</main>
      <BottomNav />
    </>
  );
}
