# Realtime Infrastructure — WebSocket и SSE

## Назначение

Realtime-инфраструктура обеспечивает мгновенную доставку изменений состояния системы клиентским приложениям без необходимости polling. Ключевые сценарии: GPS-трекинг транспорта на карте, обновление статусов заявок и рейсов, новые сообщения в чате, обновление цен на бирже.

## Архитектура

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Domain Services                          │
│  (Marketplace, Transport, Tracking, Messenger, Finance...)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Domain Events
                           ▼
                  ┌────────────────┐
                  │  Kafka Broker  │
                  │ topic: realtime│
                  └───────┬────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │   Realtime Bridge      │
             │  (Kafka Consumer)      │
             │  - Event routing       │
             │  - Authorization check │
             └───────────┬────────────┘
                         │ publish to Redis channel
                         ▼
              ┌──────────────────────┐
              │   Redis Pub/Sub      │
              │ ch: user:{user_id}   │
              │ ch: entity:{type}:{id}│
              └──────┬───────────────┘
          ┌──────────┼──────────┐
          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  WS GW   │ │  WS GW   │ │  WS GW   │   (N stateless instances)
    │ Instance │ │ Instance │ │ Instance │
    └──────────┘ └──────────┘ └──────────┘
         │              │            │
    [Client A]     [Client B]   [Client C]
  (Browser/Mobile)  (Browser)  (Driver App)
```

**Ключевой принцип**: WebSocket Gateway — stateless. Все сессии хранятся только локально в памяти инстанса. Redis Pub/Sub обеспечивает fan-out между инстансами.

## WebSocket Gateway

### Аутентификация подключения

```text
1. Клиент получает WS-ticket через REST:
   POST /api/v1/realtime/ticket
   Authorization: Bearer {jwt_token}
   → { "ticket": "short_lived_token", "expires_in": 30 }

2. Клиент устанавливает WS-соединение:
   wss://realtime.platform.example/ws?ticket=short_lived_token

3. Gateway валидирует ticket (Redis lookup, TTL 30 сек)
4. При успехе — соединение установлено, user_id сохранён в контексте сессии
```

WS-ticket имеет TTL 30 секунд и одноразовый: после использования удаляется. Это предотвращает перехват URL-параметра.

### Протокол обмена сообщениями

Все фреймы — JSON-объекты:

**Клиент → Сервер:**

```json
// Подписка на канал
{ "type": "SUBSCRIBE", "channel": "shipment:uuid-123" }

// Отписка
{ "type": "UNSUBSCRIBE", "channel": "shipment:uuid-123" }

// Heartbeat
{ "type": "PING", "timestamp": 1710507600000 }
```

**Сервер → Клиент:**

```json
// Событие
{
  "type": "EVENT",
  "channel": "shipment:uuid-123",
  "event": "SHIPMENT_STATUS_CHANGED",
  "payload": {
    "shipment_id": "uuid-123",
    "from_status": "IN_TRANSIT",
    "to_status": "ARRIVED_AT_DELIVERY",
    "timestamp": "2025-03-15T14:30:00Z"
  },
  "seq": 4821
}

// Ответ на PING
{ "type": "PONG", "timestamp": 1710507600000 }

// Подтверждение подписки
{ "type": "SUBSCRIBED", "channel": "shipment:uuid-123" }
```

### Типы каналов подписки

| Канал              | Формат                           | Доступ                    |
| ------------------ | -------------------------------- | ------------------------- |
| Личные уведомления | `user:{user_id}`                 | Только свой user_id       |
| Чат по сущности    | `conversation:{conversation_id}` | Участник беседы           |
| Статус отправки    | `shipment:{shipment_id}`         | Участник сделки           |
| GPS-трекинг        | `telemetry:{shipment_id}`        | Участник сделки           |
| Бирже-обновления   | `market:loads`                   | Любой аутентифицированный |
| Публичный трекинг  | `tracking:{tracking_token}`      | Публичный (без auth)      |

Gateway авторизует каждую подписку через `Realtime Bridge` перед подтверждением.

### Heartbeat и Reconnect

```text
Клиент отправляет PING каждые 30 секунд.
Сервер отвечает PONG в течение 5 секунд.
Если PONG не получен за 5 сек → соединение считается разорванным.

Клиент при потере соединения — exponential backoff reconnect:
  Попытка 1: через 1 сек
  Попытка 2: через 2 сек
  Попытка 3: через 4 сек
  Попытка 4: через 8 сек
  Попытка 5: через 16 сек
  Попытка 6+: через 30 сек (максимум)

После reconnect клиент отправляет seq последнего полученного события.
Сервер доставляет пропущенные события (Missed Events Recovery).
```

### Missed Events Recovery

```http
GET /api/v1/realtime/events?channel=shipment:uuid-123&after_seq=4820&limit=50
Authorization: Bearer {jwt_token}
```

Сервер хранит последние 1000 событий на канал в Redis (TTL 5 минут) для возможности наверстать пропущенные события при кратком обрыве.

## Server-Sent Events (SSE)

SSE используется как альтернатива WebSocket для сценариев, где клиент только получает данные (read-only):

| Сценарий                                   | Технология |
| ------------------------------------------ | ---------- |
| Публичная страница отслеживания груза      | SSE        |
| Дашборд грузовладельца (только просмотр)   | SSE или WS |
| Приложение водителя (отправка + получение) | WebSocket  |
| Диспетчерская панель                       | WebSocket  |

SSE-endpoint:

```http
GET /api/v1/tracking/{tracking_token}/stream
Accept: text/event-stream

HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no

data: {"event":"POSITION_UPDATED","lat":55.7558,"lon":37.6173,"speed":62}

data: {"event":"STATUS_CHANGED","status":"ARRIVED_AT_DELIVERY"}
```

## Масштабирование

### Лимиты на инстанс

| Параметр                                  | Значение                                             |
| ----------------------------------------- | ---------------------------------------------------- |
| Максимум WS-соединений на инстанс         | 10 000                                               |
| Целевое количество подписок на соединение | ≤ 10                                                 |
| RAM на соединение                         | ~4 KB                                                |
| Горизонтальное масштабирование            | Через Kubernetes HPA по метрике `active_connections` |

### Redis Pub/Sub нагрузка

Для GPS-трекинга активных рейсов события могут генерироваться каждые 5–30 секунд. При 1000 активных рейсов — до 200 событий/сек через Redis. Redis Pub/Sub выдерживает такую нагрузку без sharding.

При росте > 10 000 активных рейсов — переход на Redis Cluster с шардированием по `shipment_id`.

## Метрики

| Метрика                    | Алерт-порог        |
| -------------------------- | ------------------ |
| Активные WS-соединения     | — (информационная) |
| Reconnect rate             | > 5%/мин → алерт   |
| Event delivery latency P99 | > 2 сек → алерт    |
| Redis Pub/Sub lag          | > 500 мс → алерт   |
| Gateway CPU                | > 70% → scale out  |
