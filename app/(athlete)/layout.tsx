import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { Motion } from "@/components/motion";
import { avatarFromClaims } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";

export default function AthleteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <Motion />
      <header className="app-bar">
        <Link href="/quests" aria-label="LIMITLINE, go to My quests" style={{ textDecoration: "none" }}>
          <Logo size={20} />
        </Link>
      </header>
      <main className="page">{children}</main>
      {/* The bar shows at once with the silhouette; the photo streams in when the session is read. */}
      <Suspense fallback={<BottomNav avatarUrl={null} />}>
        <NavWithAvatar />
      </Suspense>
    </>
  );
}

async function NavWithAvatar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <BottomNav avatarUrl={avatarFromClaims(data?.claims as Record<string, unknown> | undefined)} />;
}
