"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_LABELS, SUBSCRIPTION_STATUSES } from "@/lib/subscription";
import { ArrowLeft } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  is_blocked: boolean;
  role: string;
  created_at: string;
  updated_at: string;
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subStatus, setSubStatus] = useState("");
  const [role, setRole] = useState("user");
  const [blocked, setBlocked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setUser(json);
        setSubStatus(json.subscription_status);
        setRole(json.role);
        setBlocked(json.is_blocked);
      })
      .catch(() => toast({ title: "Ошибка", description: "Пользователь не найден", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_status: subStatus,
          role,
          is_blocked: blocked,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка обновления");
      setUser(json);
      toast({ title: "Сохранено", description: "Пользователь обновлён.", variant: "success" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить этого пользователя навсегда? Это действие нельзя отменить.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка удаления");
      toast({ title: "Удалено", description: "Пользователь удалён.", variant: "success" });
      router.push("/admin");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Пользователь: {user.email}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Подробности</CardTitle>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            ID: {user.id} · Создан: {new Date(user.created_at).toLocaleString("ru-RU")}
          </CardContent>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <CardTitle className="text-base">Подписка</CardTitle>
            <div className="space-y-2">
              <Label>Статус подписки</Label>
              <Select value={subStatus} onValueChange={setSubStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {SUBSCRIPTION_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Начало:</span>{" "}
                {user.subscription_start
                  ? new Date(user.subscription_start).toLocaleDateString("ru-RU", {
                      dateStyle: "medium",
                    })
                  : "—"}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Конец:</span>{" "}
                {user.subscription_end
                  ? new Date(user.subscription_end).toLocaleDateString("ru-RU", {
                      dateStyle: "medium",
                    })
                  : "—"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Пользователь</SelectItem>
                <SelectItem value="admin">Админ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Заблокировать (запретить доступ)</Label>
            <Select value={blocked ? "yes" : "no"} onValueChange={(v) => setBlocked(v === "yes")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Нет</SelectItem>
                <SelectItem value="yes">Да (заблокирован)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Удаление…" : "Удалить пользователя"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
