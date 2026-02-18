"use client";

import { useState, useEffect } from "react";
import { Coins, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { NBRBRate } from "@/types";

const MAJOR = ["USD", "EUR", "RUB", "PLN", "UAH", "CNY", "GBP", "CHF", "JPY"];

export function CurrencySection() {
  const [rates, setRates] = useState<NBRBRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("BYN");
  const [amount, setAmount] = useState("1");
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/currency")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRates(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        toast({ title: "Ошибка", description: "Не удалось загрузить курсы валют", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const byCode = Object.fromEntries(
    rates.map((r) => [r.Cur_Abbreviation, { rate: r.Cur_OfficialRate, scale: r.Cur_Scale }])
  );
  const displayRates = rates.filter((r) => MAJOR.includes(r.Cur_Abbreviation));

  const convert = (from: string, to: string, val: number): number => {
    if (from === to) return val;
    const fromInfo = from === "BYN" ? { rate: 1, scale: 1 } : byCode[from];
    const toInfo = to === "BYN" ? { rate: 1, scale: 1 } : byCode[to];
    if (!fromInfo || !toInfo) return 0;
    const inByn = from === "BYN" ? val : (val * fromInfo.rate) / fromInfo.scale;
    return to === "BYN" ? inByn : (inByn * toInfo.scale) / toInfo.rate;
  };

  const numAmount = parseFloat(amount) || 0;
  const result = convert(fromCur, toCur, numAmount);

  return (
    <div className="space-y-4">
      <Card className="card-currency">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Coins className="h-5 w-5 text-emerald-500" />
            Курсы валют (НБРБ к BYN)
          </CardTitle>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Официальные дневные курсы Национального банка Республики Беларусь.
          </CardContent>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка курсов…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-emerald-700 dark:text-emerald-300">Валюта</TableHead>
                    <TableHead className="text-emerald-700 dark:text-emerald-300">Ед.</TableHead>
                    <TableHead className="text-right text-emerald-700 dark:text-emerald-300">Курс (BYN)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRates.map((r) => (
                    <TableRow key={r.Cur_ID}>
                      <TableCell className="font-medium">{r.Cur_Abbreviation}</TableCell>
                      <TableCell>{r.Cur_Scale}</TableCell>
                      <TableCell className="text-right">{r.Cur_OfficialRate.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Calculator className="h-5 w-5 text-emerald-500" />
            Конвертер
          </CardTitle>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Конвертация между отображаемыми валютами и BYN.
          </CardContent>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Из</Label>
              <Select value={fromCur} onValueChange={setFromCur}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BYN">BYN</SelectItem>
                  {displayRates.map((r) => (
                    <SelectItem key={r.Cur_ID} value={r.Cur_Abbreviation}>
                      {r.Cur_Abbreviation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>В</Label>
            <Select value={toCur} onValueChange={setToCur}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BYN">BYN</SelectItem>
                {displayRates.map((r) => (
                  <SelectItem key={r.Cur_ID} value={r.Cur_Abbreviation}>
                    {r.Cur_Abbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
            {numAmount.toLocaleString()} {fromCur} = {result.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCur}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
