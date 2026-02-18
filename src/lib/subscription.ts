import type { SubscriptionStatus, UserProfile } from "@/types";

/** Два типа подписки в приложении */
export const SUBSCRIPTION = {
  FREE: "free" as const,
  PREMIUM: "premium" as const,
} satisfies Record<string, SubscriptionStatus>;

export const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  free: "Бесплатная",
  premium: "Премиум",
};

/** Список преимуществ Premium — единый источник для pricing и dashboard */
export const PREMIUM_FEATURES = [
  "Всё из бесплатного тарифа",
  "Прогноз на 7 дней",
  "Почасовой прогноз (24 ч)",
  "Оповещения о погоде",
  "Без рекламы",
  "До 10 сохранённых городов",
  "Экспорт в PDF/CSV",
  "Приоритетная поддержка",
] as const;

/** Проверка, активна ли премиум-подписка (по профилю или по статусу). Админы считаются премиум. */
export function isPremium(
  profileOrStatus:
    | UserProfile
    | { subscription_status?: SubscriptionStatus; role?: string }
    | SubscriptionStatus
): boolean {
  if (typeof profileOrStatus === "string") {
    return profileOrStatus === SUBSCRIPTION.PREMIUM;
  }
  if (profileOrStatus?.role === "admin") return true;
  const status = profileOrStatus?.subscription_status;
  return status === SUBSCRIPTION.PREMIUM;
}

/** Все допустимые значения статуса подписки */
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  SUBSCRIPTION.FREE,
  SUBSCRIPTION.PREMIUM,
];
