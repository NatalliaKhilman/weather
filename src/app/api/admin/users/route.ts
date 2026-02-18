import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get("limit") || "10", 10)));
  const search = searchParams.get("search")?.trim() || "";
  const offset = (page - 1) * limit;

  let query = supabase.from("user_profiles").select("id, email, subscription_status, subscription_start, subscription_end, is_blocked, role, created_at", { count: "exact" });

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
