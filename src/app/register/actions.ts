"use server";

import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  const rawEmail = formData.get("email");
  const password = formData.get("password");

  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Введите корректный email." };
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов.` };
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: undefined },
  });

  if (authError) {
    if (
      authError.message?.includes("already registered") ||
      authError.message?.toLowerCase().includes("already exists")
    ) {
      return { ok: false, error: "Пользователь с таким email уже зарегистрирован." };
    }
    return { ok: false, error: authError.message || "Ошибка создания пользователя." };
  }

  const id = authData.user?.id;
  if (!id) {
    return { ok: false, error: "Не удалось создать пользователя." };
  }

  const role = email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
  const { error: profileError } = await supabase.from("user_profiles").insert({
    id,
    email,
    role,
  });

  if (profileError && profileError.code !== "23505") {
    return { ok: false, error: profileError.message || "Ошибка создания профиля." };
  }

  return { ok: true };
}
