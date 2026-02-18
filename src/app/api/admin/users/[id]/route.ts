import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { SUBSCRIPTION_STATUSES } from "@/lib/subscription";
import type { SubscriptionStatus } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (typeof body.subscription_status === "string" && SUBSCRIPTION_STATUSES.includes(body.subscription_status as SubscriptionStatus)) {
    updates.subscription_status = body.subscription_status;
    if (body.subscription_status === "premium" && (body.subscription_end || body.subscription_start)) {
      if (body.subscription_start) updates.subscription_start = body.subscription_start;
      if (body.subscription_end) updates.subscription_end = body.subscription_end;
    } else if (body.subscription_status === "free") {
      updates.subscription_start = null;
      updates.subscription_end = null;
    }
  }
  if (typeof body.is_blocked === "boolean") updates.is_blocked = body.is_blocked;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Не даём удалить самого себя
  if ((session as any).user?.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Сначала удаляем запись из user_profiles
  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Удаляем пользователя из Supabase Auth (чтобы не мог войти снова)
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) {
    // Если пользователя нет в Auth (например, только профиль) — не считаем ошибкой
    if (authError.message?.includes("User not found") || authError.status === 404) {
      return NextResponse.json({ deleted: true });
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
