# Push-уведомления — FCM / APNs

## Назначение

Push-уведомления — основной канал оперативного оповещения мобильных пользователей (водители, диспетчеры, логисты). Доставляются на устройство независимо от того, открыто ли приложение.

## Провайдеры

| Провайдер                              | Платформа          | Протокол            |
| -------------------------------------- | ------------------ | ------------------- |
| Firebase Cloud Messaging (FCM)         | Android, Web (PWA) | HTTP/2 (FCM v1 API) |
| Apple Push Notification service (APNs) | iOS, macOS         | HTTP/2 + JWT        |

Взаимодействие с обоими провайдерами осуществляется через единый внутренний `Push Adapter`, скрывающий различия API.

## Регистрация и управление токенами

### Жизненный цикл токена устройства

```text
1. Пользователь устанавливает приложение
2. ОС генерирует FCM/APNs токен
3. Приложение отправляет токен на сервер:
   POST /api/v1/devices/push-tokens
   { "token": "...", "platform": "ANDROID", "app_version": "2.1.0" }
4. Сервер сохраняет токен в таблице device_push_tokens
5. Токен используется для отправки Push
```

### Инвалидация устаревших токенов

Токены становятся невалидными при:

- Удалении приложения.
- Сбросе настроек устройства.
- Отзыве разрешений на Push.
- Длительном неиспользовании (APNs: > 1 год).

При получении ошибки `InvalidRegistration` (FCM) или `BadDeviceToken` (APNs) токен немедленно удаляется из БД.

### Таблица токенов

```sql
CREATE TABLE device_push_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    token        TEXT NOT NULL,
    platform     TEXT NOT NULL,  -- 'ANDROID', 'IOS', 'WEB'
    app_version  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_device_token UNIQUE (token)
);

CREATE INDEX idx_push_tokens_user ON device_push_tokens (user_id) WHERE is_active = TRUE;
```

## Структура Push-уведомления

### FCM Payload (Android)

```json
{
  "message": {
    "token": "device_fcm_token",
    "notification": {
      "title": "Оффер принят",
      "body": "Ваш оффер на груз Москва → Краснодар принят. Ожидайте назначения водителя."
    },
    "data": {
      "event_type": "OFFER_ACCEPTED",
      "entity_type": "OFFER",
      "entity_id": "uuid-offer-id",
      "navigate_to": "/shipments/uuid-shipment-id"
    },
    "android": {
      "priority": "high",
      "ttl": "3600s",
      "notification": {
        "channel_id": "operational",
        "sound": "default"
      }
    }
  }
}
```

### APNs Payload (iOS)

```json
{
  "aps": {
    "alert": {
      "title": "Оффер принят",
      "body": "Ваш оффер на груз Москва → Краснодар принят."
    },
    "badge": 3,
    "sound": "default",
    "content-available": 0
  },
  "event_type": "OFFER_ACCEPTED",
  "entity_id": "uuid-offer-id",
  "navigate_to": "/shipments/uuid-shipment-id"
}
```

### Silent Push (фоновая синхронизация)

Для бесшумного обновления данных приложения водителя без показа уведомления:

```json
{
  "aps": {
    "content-available": 1
  },
  "sync_type": "TELEMETRY_SETTINGS",
  "payload": {}
}
```

FCM-аналог: поле `data` без `notification`, параметр `priority: "normal"`.

## Android Notification Channels

Для Android 8+ (API 26+) Push-уведомления разделены по каналам:

| Channel ID      | Название                | Важность | Звук | Вибрация |
| --------------- | ----------------------- | -------- | ---- | -------- |
| `critical`      | Критические алерты      | URGENT   | ✅   | ✅       |
| `operational`   | Операционные обновления | HIGH     | ✅   | ✅       |
| `financial`     | Финансовые уведомления  | DEFAULT  | ✅   | —        |
| `informational` | Информационные          | LOW      | —    | —        |

Пользователь может управлять каналами в настройках Android независимо от настроек приложения.

## Web Push (PWA)

Web Push реализован через Web Push Protocol (RFC 8030) с использованием VAPID-ключей:

```text
1. Браузер запрашивает Push Subscription у Service Worker
2. Subscription (endpoint + keys) передаётся на сервер
3. Сервер шифрует payload с публичным ключом браузера (RFC 8291)
4. Сервер отправляет зашифрованный payload на endpoint провайдера браузера
5. Провайдер доставляет Push в Service Worker
6. Service Worker отображает уведомление через Notification API
```

## Метрики и аналитика Push

| Метрика                             | Целевое значение |
| ----------------------------------- | ---------------- |
| Delivery Rate (Android)             | > 95%            |
| Delivery Rate (iOS)                 | > 90%            |
| Open Rate                           | > 20%            |
| Token Invalidation Rate             | < 5%/мес         |
| P95 Latency (отправка → устройство) | < 3 сек          |

## Ограничения провайдеров

| Параметр                    | FCM                      | APNs                           |
| --------------------------- | ------------------------ | ------------------------------ |
| Максимальный размер payload | 4 KB                     | 4 KB                           |
| TTL (время жизни в очереди) | До 4 недель              | До 30 дней                     |
| Rate limit (на токен)       | 1000/день                | Не указан, throttling по сбоям |
| Batch отправка              | До 500 токенов за запрос | 1 запрос = 1 устройство        |

Для массовых рассылок используется FCM Multicast (до 500 токенов за запрос) или Topic Messaging.
