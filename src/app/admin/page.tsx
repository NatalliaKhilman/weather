"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_LABELS } from "@/lib/subscription";
import type { SubscriptionStatus } from "@/types";
import { ArrowLeft, Search } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  subscription_status: string;
  subscription_start: string | null;
  subscription_end: string | null;
  is_blocked: boolean;
  role: string;
  created_at: string;
};

type ListResponse = {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [page, search, toast]);

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    const params = new URLSearchParams({ page: "1", limit: "10" });
    if (search) params.set("search", search);
    fetch(`/api/admin/users?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Админ — Пользователи</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все пользователи</CardTitle>
          <form onSubmit={runSearch} className="flex gap-2 mt-2">
            <Input
              placeholder="Поиск по email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Загрузка…</p>
          ) : data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Подписка</TableHead>
                    <TableHead>Период подписки</TableHead>
                    <TableHead>Заблокирован</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Админ" : "Пользователь"}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.subscription_status === "premium" || u.role === "admin" ? "success" : "secondary"}>
                          {u.subscription_status === "premium"
                            ? "Премиум"
                            : u.role === "admin"
                              ? "Премиум (Админ)"
                              : SUBSCRIPTION_LABELS[u.subscription_status as SubscriptionStatus] ?? u.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.subscription_start && u.subscription_end
                          ? `${new Date(u.subscription_start).toLocaleDateString("ru-RU")} — ${new Date(u.subscription_end).toLocaleDateString("ru-RU")}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {u.is_blocked ? (
                          <Badge variant="destructive">Заблокирован</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${u.id}`}>Открыть</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Всего: {data.total} · Страница {data.page} из {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Далее
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Нет данных.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
