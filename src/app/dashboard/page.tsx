"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { DashboardContent } from "@/components/dashboard-content";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { update } = useSession();
  const verifiedRef = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("success") !== "true" || verifiedRef.current) return;
    verifiedRef.current = true;

    async function verify() {
      if (sessionId) {
        try {
          const res = await fetch("/api/stripe/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            console.error("Subscription verify failed:", json.error);
          }
        } catch (e) {
          console.error("Subscription verify error:", e);
        }
      }
      await update();
      toast({
        title: "Оплата прошла успешно",
        description: "Ваша премиум-подписка активирована.",
        variant: "success",
      });
      window.history.replaceState({}, "", "/dashboard");
    }

    verify();
  }, [searchParams, toast, update]);

  return (
    <div className="container py-6">
      <DashboardContent />
    </div>
  );
}
