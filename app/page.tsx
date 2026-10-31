import { redirect } from "next/navigation";

// Home is My quests (design 1A).
export default function Home() {
  redirect("/quests");
}
