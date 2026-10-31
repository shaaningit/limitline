import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="page">
      <h1>LIMITLINE</h1>
      <p>Beat your own limit, earn embers.</p>
      <LoginForm expired={error === "expired"} />
    </main>
  );
}
