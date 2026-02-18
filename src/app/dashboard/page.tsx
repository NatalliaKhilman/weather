"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DashboardContent } from "@/components/dashboard-content";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Payment successful",
        description: "Your premium subscription is now active.",
        variant: "success",
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, toast]);

  return (
    <div className="container py-6">
      <DashboardContent />
    </div>
  );
}
