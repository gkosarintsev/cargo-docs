# Встроенный бизнес-мессенджер

## Концептуальная модель

Мессенджер платформы — контекстный: каждая беседа жёстко привязана к конкретной бизнес-сущности. Это исключает потерю переписки и обеспечивает полный аудит всех коммуникаций по сделке.

| Тип контекста                        | Участники                                 | Назначение                               |
| ------------------------------------ | ----------------------------------------- | ---------------------------------------- |
| `Load ↔ Conversation`                | Грузовладелец + потенциальные перевозчики | Уточнение деталей груза до подачи оффера |
| `Offer / Negotiation ↔ Conversation` | Грузовладелец + конкретный перевозчик     | Согласование цены и коммерческих условий |
| `Shipment ↔ Conversation`            | Водитель + Диспетчер + Логист заказчика   | Оперативная связь в ходе рейса           |
| `Support ↔ Conversation`             | Пользователь + Агент поддержки            | Обращение в техподдержку платформы       |

## Модель данных

### Conversation

```sql
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL,          -- 'LOAD', 'OFFER', 'SHIPMENT', 'SUPPORT'
    entity_id       UUID NOT NULL,
    title           TEXT,
    participants    UUID[] NOT NULL,        -- массив user_id
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at     TIMESTAMPTZ,

    CONSTRAINT uq_conversation_entity UNIQUE (entity_type, entity_id)
);

CREATE INDEX idx_conversations_entity ON conversations (entity_type, entity_id);
CREATE INDEX idx_conversations_participant ON conversations USING GIN (participants);
```

### Message

```sql
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    text            TEXT,
    attachments     JSONB DEFAULT '[]',     -- массив Attachment
    reply_to_id     UUID REFERENCES messages(id),
    message_type    TEXT NOT NULL DEFAULT 'USER',  -- 'USER', 'SYSTEM', 'LOCATION'
    metadata        JSONB DEFAULT '{}',     -- для системных сообщений
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at       TIMESTAMPTZ,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
```

### MessageStatus (Read Receipts)

```sql
CREATE TABLE message_status (
    message_id   UUID NOT NULL REFERENCES messages(id),
    user_id      UUID NOT NULL REFERENCES users(id),
    delivered_at TIMESTAMPTZ,
    read_at      TIMESTAMPTZ,

    PRIMARY KEY (message_id, user_id)
);
```

### Attachment

```json
{
  "file_id": "uuid",
  "mime_type": "image/jpeg",
  "file_name": "waybill.jpg",
  "s3_url": "https://s3.example.com/attachments/uuid/waybill.jpg",
  "thumbnail_url": "https://s3.example.com/attachments/uuid/waybill_thumb.jpg",
  "file_size": 245760
}
```

Файлы вложений хранятся в S3-совместимом хранилище. Загрузка — через presigned URL напрямую с клиента, минуя сервер приложения.

## Функциональные возможности

### Статусы прочтения (Read Receipts)

- `SENT` — сообщение записано в БД.
- `DELIVERED` — WebSocket-соединение получателя подтвердило доставку (ACK-фрейм).
- `READ` — клиент зафиксировал событие `message_viewed` (IntersectionObserver в браузере).

### Typing Indicator

Клиент отправляет событие `typing_started` по WebSocket при начале ввода и `typing_stopped` при паузе более 3 секунд. Сервер транслирует событие участникам беседы, но не персистирует его — это эфемерное состояние.

### Быстрые шаблоны ответов

Предустановленные фразы для водителей и диспетчеров, доступные по одному нажатию:

- «Машина на месте»
- «Документы подписаны»
- «Ожидаю погрузку»
- «Выехал на маршрут»
- «Задержка, уточняю время»

Шаблоны хранятся в таблице `message_templates` и настраиваются администратором платформы.

### Системные сообщения

При изменении статуса связанной сущности система автоматически публикует сообщение с `message_type = 'SYSTEM'`:

```json
{
  "message_type": "SYSTEM",
  "metadata": {
    "event": "SHIPMENT_STATUS_CHANGED",
    "from_status": "IN_TRANSIT",
    "to_status": "ARRIVED_AT_DELIVERY",
    "timestamp": "2025-03-15T14:30:00Z"
  },
  "text": "Рейс прибыл в точку назначения"
}
```

## Защита от обхода платформы (Anti-Disintermediation)

До момента заключения сделки (статус оффера `ACCEPTED`) в чатах типа `LOAD` и `OFFER` активен фильтр контента:

- **Маскировка телефонных номеров**: регулярное выражение `(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}` заменяет номер на `+7 *** ***-**-**`.
- **Блокировка внешних ссылок**: URL вне whitelist (официальный сайт, документация) скрываются.
- **Аудит-лог**: все срабатывания фильтра записываются для ручной проверки модератором.

После заключения сделки ограничения снимаются — стороны получают прямой контакт.

## Retention Policy

| Тип данных                        | Срок хранения            |
| --------------------------------- | ------------------------ |
| Сообщения (текст)                 | 3 года                   |
| Вложения (файлы)                  | 1 год (затем S3 Glacier) |
| Системные сообщения               | Срок жизни сущности      |
| Технические события (typing, ACK) | Не хранятся              |

## Архитектура доставки

```text
Client (Browser / Mobile)
       ↕ WebSocket (primary)
       ↕ Long-Polling (fallback при блокировке WS)
Realtime Gateway (stateless, N instances)
       ↓
   Redis Pub/Sub
   Channel: conversation:{conversation_id}
       ↓
  [Gateway Instance 1] → [Client A]
  [Gateway Instance 2] → [Client B]
       ↓
   PostgreSQL
   (persistent store — write-ahead)
```

Запись сообщения в PostgreSQL происходит **синхронно** до отправки клиенту. Реалтайм-доставка — best-effort поверх персистентного хранения. Клиент при reconnect догружает пропущенные сообщения через REST API (`GET /conversations/{id}/messages?after={last_message_id}`).
