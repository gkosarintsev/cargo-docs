# Промпт 28 — Коммуникации, Мессенджер, Нотификации и Real-time

> **Файлы на выходе:**
>
> - `docs/13-communication/messenger.md`
> - `docs/13-communication/notifications.md`
> - `docs/13-communication/email.md`
> - `docs/13-communication/sms.md`
> - `docs/13-communication/push.md`
> - `docs/13-communication/realtime.md`

---

## Контекст

Проектируем коммуникационный домен платформы (раздел **13-communication**, Этап 9).
Коммуникации охватывают встроенный мессенджер (контекстные чаты по грузам, офферам и рейсам), многоканальную службу нотификаций (Push, Email, SMS, In-App) и инфраструктуру real-time доставки событий по WebSocket/SSE (из §24 и §25 master-prompt).

Язык — **русский**.

---

## Задание 1: создай `docs/13-communication/messenger.md`

### Содержимое документа (Встроенный бизнес-мессенджер)

1. **Концептуальная модель мессенджера**:
   - Контекстность бесед: каждый чат строго привязан к бизнес-сущности:
     - `Load ↔ Conversation` (уточнение деталей груза до подачи оффера).
     - `Offer / Negotiation ↔ Conversation` (согласование цены и условий торга).
     - `Shipment ↔ Conversation` (оперативная связь между водителем, диспетчером и логистом заказчика в рейсе).
     - `Support ↔ Conversation` (обращение в техподдержку платформы).
2. **Модель сущностей**:
   - `Conversation` (id, entity_type, entity_id, participants_list, created_at, last_message_at, is_archived).
   - `Message` (id, conversation_id, sender_id, text, attachments_list, reply_to_id, created_at, status: `SENT`, `DELIVERED`, `READ`).
   - `Attachment` (file_id, mime_type, file_name, s3_url, thumbnail_url, file_size).
3. **Функциональные возможности**:
   - Статусы прочтения (Read Receipts), индикатор набора текста (Typing Indicator), быстрые шаблоны ответов («Машина на месте», «Документы подписаны»).
   - Модерация и аудит сообщений (автоматическое скрытие номеров телефонов и ссылок в публичных чатах до заключения сделки для защиты от обхода платформы — Disintermediation Protection).
   - Retention policy для сообщений и вложений.

---

## Задание 2: создай `docs/13-communication/notifications.md`

### Содержимое документа (Notification Service / Шлюз уведомлений)

1. **Архитектурный принцип**:
   - Доменные сервисы НЕ должны знать о существовании SMTP/SMS/Push провайдеров.
   - Схема: `Domain Event (Kafka) → Notification Engine → Profile & Preferences Resolver → Multi-channel Router → Delivery Adapters (FCM, SMS, SMTP, WS)`.
2. **Матрица маршрутизации уведомлений**:
   - Пользовательские настройки (Preferences): какие каналы включены для каких типов событий (например: критические алерты по рейсу — SMS + Push; ежедневные сводки — Email; новые офферы — In-App + Push).
   - Приоритизация очередей: `HIGH` (OTP-коды, аварии), `MEDIUM` (новые заказы, смена статуса), `LOW` (маркетинговые рассылки).
3. **Дедупликация и объединение (Digest / Throttling)**:
   - Объединение частых однотипных событий в одно письмо-дайджест (например, «У вас 15 новых подходящих грузов за последний час»).

---

## Задание 3: создай файлы каналов доставки (`email.md`, `sms.md`, `push.md`)

1. **`push.md` (Push-уведомления для мобильных и веб-клиентов)**:
   - Интеграция с Firebase Cloud Messaging (FCM) и Apple Push Notification service (APNs).
   - Фоновые пуши для синхронизации данных приложения водителя (Silent Push).
   - Обработка токенов устройств (регистрация, инвалидация устаревших токенов).
2. **`email.md` (Транзакционные и триггерные Email)**:
   - Шаблонизация писем (MJML / HTML-шаблоны с адаптивной версткой для смартфонов).
   - Доставка через SMTP / HTTP API (SendGrid, Postmark, VK Mail).
   - Настройка SPF, DKIM, DMARC для защиты от спама.
3. **`sms.md` (SMS и мессенджер-шлюзы)**:
   - Сценарии использования: 2FA/OTP коды авторизации, критические оповещения водителей при отсутствии мобильного интернета.
   - Интеграция с SMS-провайдерами (SMSC, Stream Telecom) с fallback-каналами.

---

## Задание 4: создай `docs/13-communication/realtime.md`

### Содержимое документа (WebSocket и SSE инфраструктура)

1. **Архитектура Real-time соединений**:
   - Web SPA и Mobile Apps поддерживают постоянное WebSocket-соединение с `Realtime Gateway`.
   - Масштабирование через Redis Pub/Sub: брокер распределяет события на все ноды шлюза к нужным клиентским сокетам.
2. **Протокол сообщений WebSocket (WS Subscriptions)**:
   - Команды подписки: `SUBSCRIBE /shipments/{id}/telemetry`, `SUBSCRIBE /conversations/{id}`, `SUBSCRIBE /user/notifications`.
   - Heartbeat / Ping-Pong механизм для детекции обрыва связи и мгновенного переподключения (Reconnection with exponential backoff).

---

## Важные замечания для выполнения

- Опиши механизмы защиты от обхода платформы (Anti-disintermediation) в мессенджере.
- Пропиши стратегию гарантированной доставки уведомлений при нестабильном интернете у водителей.
