import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "admin@example.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: credentials.password,
        });
        if (error || !data?.user) return null;
        return { id: data.user.id, email: data.user.email ?? email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: { id?: string; email?: string | null } }) {
      if (!user?.email) return false;
      const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id, role")
        .eq("email", user.email)
        .single();
      if (!existing) {
        await supabase.from("user_profiles").insert({
          id: user.id!,
          email: user.email,
          role: isAdmin ? "admin" : "user",
        });
      } else if (isAdmin && existing.role !== "admin") {
        await supabase
          .from("user_profiles")
          .update({ role: "admin" })
          .eq("id", existing.id);
      }
      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.id = token.sub;
        const { data } = await supabase
          .from("user_profiles")
          .select("subscription_status, subscription_end, is_blocked, role")
          .eq("id", token.sub)
          .single();
        if (data?.is_blocked) return { ...session, error: "Blocked" };
        session.user.subscription_status = data?.subscription_status ?? "free";
        session.user.subscription_end = data?.subscription_end ?? null;
        session.user.role = data?.role ?? "user";
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) token.sub = user.id;
      return token;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
