# Notification Service — Шлюз уведомлений

## Архитектурный принцип

Доменные сервисы не должны знать о существовании SMTP/SMS/Push-провайдеров. Вся логика маршрутизации и доставки инкапсулирована в `Notification Service`.

```text
Domain Service
      ↓ publishes Domain Event
Kafka topic: platform.events
      ↓ consumed by
Notification Engine
      ├── Event → Notification mapping
      ├── Profile & Preferences Resolver
      │       (загружает настройки пользователя, DND-окна, выбранные каналы)
      ↓
Multi-channel Router
      ├── FCM / APNs          → push.md
      ├── SMTP / HTTP Email   → email.md
      ├── SMS Gateway         → sms.md
      └── WebSocket In-App    → realtime.md
```

## Модель данных

### NotificationPreference

```sql
CREATE TABLE notification_preferences (
    user_id         UUID NOT NULL REFERENCES users(id),
    event_type      TEXT NOT NULL,
    channel         TEXT NOT NULL,   -- 'PUSH', 'EMAIL', 'SMS', 'IN_APP'
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    dnd_start       TIME,            -- начало Do-Not-Disturb окна (локальное время)
    dnd_end         TIME,            -- конец DND-окна
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, event_type, channel)
);
```

### Notification

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    event_type      TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    payload         JSONB DEFAULT '{}',
    priority        TEXT NOT NULL DEFAULT 'MEDIUM',  -- 'HIGH', 'MEDIUM', 'LOW'
    channel         TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at         TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    failure_reason  TEXT,
    retry_count     INT NOT NULL DEFAULT 0,

    CONSTRAINT uq_notification_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_status ON notifications (status) WHERE status IN ('PENDING', 'FAILED');
```

**Idempotency key**: формируется как `SHA256(event_id || user_id || channel)`. Предотвращает дублирование уведомлений при повторной обработке события из Kafka.

## Матрица маршрутизации

| Тип события          | In-App | Push | Email | SMS |
| -------------------- | ------ | ---- | ----- | --- |
| Новый оффер на груз  | ✅     | ✅   | —     | —   |
| Оффер принят         | ✅     | ✅   | ✅    | —   |
| Водитель назначен    | ✅     | ✅   | ✅    | —   |
| Рейс начат           | ✅     | ✅   | —     | —   |
| Прибытие на погрузку | ✅     | ✅   | —     | ✅  |
| Доставка завершена   | ✅     | ✅   | ✅    | —   |
| Задержка рейса       | ✅     | ✅   | ✅    | ✅  |
| Аварийная ситуация   | ✅     | ✅   | ✅    | ✅  |
| Счёт выставлен       | ✅     | —    | ✅    | —   |
| Оплата получена      | ✅     | ✅   | ✅    | —   |
| Просрочка оплаты     | ✅     | ✅   | ✅    | ✅  |
| OTP-код              | —      | —    | —     | ✅  |
| Welcome-письмо       | ✅     | —    | ✅    | —   |
| Блокировка аккаунта  | ✅     | ✅   | ✅    | ✅  |

## Приоритизация очередей

| Приоритет | Примеры                                         | Целевая задержка |
| --------- | ----------------------------------------------- | ---------------- |
| `HIGH`    | OTP-коды, аварийные алерты, блокировка аккаунта | < 5 сек          |
| `MEDIUM`  | Новые заказы, смена статуса рейса, новые офферы | < 30 сек         |
| `LOW`     | Дайджесты, маркетинговые рассылки               | < 15 мин         |

Каждый приоритет обрабатывается отдельным пулом воркеров. `HIGH` — выделенные воркеры без разделения ресурсов с `LOW`.

## Дедупликация и Digest (Throttling)

### Throttling однотипных событий

Если за 1 час накапливается более 5 событий одного типа для одного пользователя — они объединяются в единое дайджест-уведомление:

```text
Событие: "Новый подходящий груз"
Накоплено за 1 час: 18 событий

Итоговое уведомление:
"У вас 18 новых подходящих грузов за последний час.
Посмотреть предложения →"
```

Конфигурация throttling хранится в таблице `notification_throttle_rules`:

```sql
CREATE TABLE notification_throttle_rules (
    event_type      TEXT PRIMARY KEY,
    window_minutes  INT NOT NULL,    -- окно агрегации
    threshold       INT NOT NULL,    -- порог срабатывания
    digest_template TEXT NOT NULL    -- шаблон дайджеста
);
```

### Retry и Dead Letter Queue

```text
ATTEMPT 1 → failed → wait 1 min
ATTEMPT 2 → failed → wait 5 min
ATTEMPT 3 → failed → wait 30 min
ATTEMPT 4 → failed → DLQ (Kafka topic: notifications.dlq)
```

DLQ обрабатывается вручную или через отдельный retention job.

## Lifecycle уведомления

```text
PENDING
  ↓ (Notification Engine picks up)
SENT          ← отправлен в канал доставки
  ↓ (delivery receipt from channel)
DELIVERED     ← подтверждено провайдером
  ↓ (user opens app / clicks)
READ
         ↘
FAILED        ← ошибка доставки (retry → DLQ)
```

## Гарантированная доставка при нестабильном интернете

Для водителей с нестабильным мобильным интернетом:

1. **SMS как резервный канал** для критических событий (`HIGH` приоритет) — отправляется параллельно с Push через 60 секунд, если Push не получил `DELIVERED`-подтверждение.
2. **In-App Inbox**: все уведомления хранятся в БД и доступны при следующем открытии приложения (независимо от Push-доставки).
3. **Offline-буфер в мобильном приложении**: при восстановлении соединения клиент запрашивает `GET /notifications/unread` и отображает накопленные уведомления.
