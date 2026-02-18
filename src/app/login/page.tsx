import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const params = await searchParams;
  const blocked = params.blocked === "1";

  return (
    <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <LoginForm blocked={blocked} />
    </div>
  );
}
