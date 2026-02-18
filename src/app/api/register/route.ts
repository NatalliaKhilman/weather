import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function GET() {
  return NextResponse.json(
    { error: "Use POST to register.", ok: false },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, password } = body as { email?: string; password?: string };

    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Введите корректный email." },
        { status: 400 }
      );
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов.` },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });

    if (authError) {
      if (authError.message?.includes("already registered") || authError.message?.toLowerCase().includes("already exists")) {
        return NextResponse.json(
          { error: "Пользователь с таким email уже зарегистрирован." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message || "Ошибка создания пользователя." },
        { status: 500 }
      );
    }

    const id = authData.user?.id;
    if (!id) {
      return NextResponse.json(
        { error: "Не удалось создать пользователя." },
        { status: 500 }
      );
    }
    const role = email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

    const { error: profileError } = await supabase.from("user_profiles").insert({
      id,
      email,
      role,
    });

    if (profileError) {
      if (profileError.code === "23505") {
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json(
        { error: profileError.message || "Ошибка создания профиля." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Произошла ошибка. Попробуйте позже.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
