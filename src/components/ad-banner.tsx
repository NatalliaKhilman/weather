"use client";

import { X } from "lucide-react";
import { useState } from "react";

const ADS = [
  {
    title: "Погода Pro для бизнеса",
    text: "Интеграция погодных данных в ваш продукт через API.",
    cta: "Узнать больше",
    color: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800",
  },
  {
    title: "Точный прогноз на 7 дней",
    text: "Перейдите на Премиум и получите расширенный прогноз, оповещения и экспорт.",
    cta: "Попробовать Премиум",
    color: "from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800",
  },
];

export function AdBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [ad] = useState(() => ADS[Math.floor(Math.random() * ADS.length)]);

  if (dismissed) return null;

  return (
    <div
      className={`relative rounded-lg border bg-gradient-to-r ${ad.color} px-4 py-3 text-sm`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Закрыть"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="font-medium pr-6">{ad.title}</p>
      <p className="text-muted-foreground text-xs mt-0.5">{ad.text}</p>
      <span className="text-xs font-medium text-primary underline mt-1 inline-block cursor-pointer">
        {ad.cta}
      </span>
      <p className="text-[10px] text-muted-foreground/60 mt-1">Реклама</p>
    </div>
  );
}
