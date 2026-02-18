import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionStatus } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "placeholder";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export type UserProfile = {
  id: string;
  email: string;
  subscription_status: SubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  is_blocked: boolean;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};
