# Оплата премиум-аккаунтов (Stripe)

Оплата уже настроена: продукт **Premium** и цены в Stripe созданы, ID прописаны в `.env.local`.

## Что сделано

- **Checkout**: `/api/stripe/checkout` — создаёт сессию Stripe Checkout (месячная $4.99 или годовая $49).
- **Webhook**: `/api/stripe/webhook` — по событиям Stripe обновляет `user_profiles.subscription_status` в Supabase (premium/free).
- Страница **Pricing** (`/pricing`) — кнопки «Subscribe monthly» и «Subscribe annually» ведут на оплату Stripe.

## Webhook (обязательно для выдачи премиума)

Без webhook после оплаты статус пользователя не станет premium.

### Локальная разработка

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

В выводе будет `whsec_...` — подставьте его в `STRIPE_WEBHOOK_SECRET` в `.env.local`.

### Продакшен

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL**: `https://ваш-домен.com/api/stripe/webhook`.
3. События: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Скопируйте **Signing secret** в `STRIPE_WEBHOOK_SECRET` в переменных окружения сервера.

## Повторное создание продукта/цен

Если понадобится создать продукт и цены заново (другой аккаунт Stripe):

```bash
node scripts/setup-stripe.js
```

Скрипт выведет `STRIPE_MONTHLY_PRICE_ID` и `STRIPE_ANNUAL_PRICE_ID` для вставки в `.env.local`.

## Дополнительные опции (add-ons)

Страница Pricing поддерживает опциональные дополнения к Premium:

| Add-on       | Описание                 | Переменная окружения              |
|--------------|--------------------------|-----------------------------------|
| Family       | Семейный доступ (+$2.99/мес) | `STRIPE_ADDON_FAMILY_PRICE_ID` |
| API Access   | REST API (+$9.99/мес)    | `STRIPE_ADDON_API_PRICE_ID`      |
| Extra cities | +20 сохранённых городов (+$1.99/мес) | `STRIPE_ADDON_CITIES_PRICE_ID` |

1. В Stripe Dashboard: **Products** → **Add product** — создайте продукт для каждого add-on.
2. Создайте **Price** (recurring, monthly).
3. Скопируйте Price ID в соответствующую переменную в `.env.local`.

Без настроенных Price ID кнопки add-on вернут ошибку 503 с подсказкой.
