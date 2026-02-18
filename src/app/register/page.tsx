import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <RegisterForm />
    </div>
  );
}
