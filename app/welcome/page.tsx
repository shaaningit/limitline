import { redirect } from "next/navigation";
import { getSession } from "@/lib/data/session";
import { WelcomeForm } from "./welcome-form";

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile) redirect("/quests");
  return (
    <main className="page">
      <h1>Welcome to LIMITLINE</h1>
      <WelcomeForm />
    </main>
  );
}
