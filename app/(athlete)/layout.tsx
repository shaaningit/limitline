import { BottomNav } from "@/components/bottom-nav";

export default function AthleteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="page">{children}</main>
      <BottomNav />
    </>
  );
}
