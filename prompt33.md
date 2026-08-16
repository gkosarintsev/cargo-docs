# Промпт 33 — Архитектура данных: Модель данных, Владение, Консистентность и Full ERD

> **Файлы на выходе:**
>
> - `docs/15-data/data-model.md`
> - `docs/15-data/ownership.md`
> - `docs/15-data/consistency.md`
> - `docs/15-data/erd/full-erd.md`

---

## Контекст

Переходим к разделу **15-data** (Этап 11).
Формируем детальную спецификацию архитектуры данных логистической платформы: физическую модель реляционных таблиц, матрицу владения данными (Data Ownership), классификацию моделей согласованности (Consistency Matrix) и полную диаграмму сущностей и связей (Full ERD) (из §19 и §20 master-prompt).

Язык — **русский**. Диаграммы — **Mermaid erDiagram**.

---

## Задание 1: создай `docs/15-data/data-model.md`

### Содержимое документа (Физическая модель данных)

1. **Реляционная схема PostgreSQL**:
   - Полное описание структуры всех таблиц, сгруппированных по Bounded Contexts.
   - Для каждой таблицы: имя, назначение, столбцы (имя, тип данных SQL, constraints: `PK`, `FK`, `NOT NULL`, `DEFAULT`, `CHECK`), комментарий.
   - Описание обязательных системных полей каждой таблицы: `id` (UUIDv4), `organization_id` (UUID, multi-tenancy), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ), `version` (INT, optimistic locking), `deleted_at` (TIMESTAMPTZ, soft delete).
2. **Стратегия индексов (Indexing Strategy)**:
   - B-Tree индексы для внешних ключей и частых фильтров (`organization_id`, `status`, `created_at`).
   - Составные индексы (Composite Indexes) под типовые запросы: `(organization_id, status, pickup_date)`.
   - Частичные индексы (Partial Indexes): `CREATE INDEX idx_active_loads ON loads (pickup_date) WHERE status = 'PUBLISHED'`.
   - GiST/SP-GiST индексы с PostGIS (`ST_SetSRID(ST_MakePoint(lon, lat), 4326)`).
   - GIN индексы для полей JSONB и полнотекстового поиска по справочникам.

---

## Задание 2: создай `docs/15-data/ownership.md`

### Содержимое документа (Матрица владения данными / Data Ownership)

1. **Принцип единого хозяина данных (Single Writer Principle)**:
   - Каждая таблица и сущность имеет ровно один Bounded Context, являющийся её владельцем (Source of Truth).
   - Любые изменения данных выполняются ТОЛЬКО через публичный API или обработчик команд соответствующего контекста.
   - Прямая запись (Direct SQL UPDATE/INSERT) в таблицы чужого контекста строго запрещена.
2. **Матрица владения данными (CRUD Matrix)**:
   - Таблица: Сущность/Таблица | Владелец (Write Authority) | Читатели (Read Access via API/Events) | Реплицируемые проекции (Read Models / Caches).

---

## Задание 3: создай `docs/15-data/consistency.md`

### Содержимое документа (Модель согласованности / Consistency Matrix)

1. **Классификация операций платформы по моделям консистентности**:
   - **Strong Consistency (Строгая согласованность / ACID в рамках агрегата)**:
     - Акцепт оффера и бронирование груза (блокировка `SELECT FOR UPDATE` или Optimistic Locking по `version`).
     - Создание и списание средств со счета / Escrow.
     - Назначение водителя/ТС на рейс (проверка отсутствия пересечения слотов).
     - Подписание электронных документов и фиксация eCMR.
   - **Eventual Consistency (Согласованность в конечном счете через события Kafka)**:
     - Синхронизация груза из PostgreSQL в индекс OpenSearch (задержка < 1 сек).
     - Рассылка уведомлений подписчикам сохраненных поисков.
     - Обновление агрегированного рейтинга и риск-скоринга контрагента.
     - Передача аналитических данных в ClickHouse.
   - **Read-Your-Writes Consistency**:
     - Гарантия для пользователя, создавшего груз или отправившего сообщение, мгновенно видеть свое изменение в UI (через локальное состояние или чтение из Primary БД).
2. **Разбор проблемы рассинхронизации (из §20 master-prompt)**:
   - _Что произойдет, если пользователь принял оффер, но OpenSearch еще не получил событие?_
   - Решение: При попытке второго перевозчика кликнуть «Принять» из поисковой выдачи запрос попадает в транзакционный `Marketplace Service`, который проверяет версию агрегата и статус в PostgreSQL и возвращает `409 Conflict («Груз уже забронирован»)` с автоматическим удалением карточки из UI клиента.

---

## Задание 4: создай `docs/15-data/erd/full-erd.md`

### Содержимое документа (Полная ER-диаграмма платформы)

1. Полная **Mermaid `erDiagram`** со всеми таблицами всех 12 Bounded Contexts:
   - `IAM`: `organizations`, `users`, `roles`, `permissions`, `user_roles`, `api_clients`, `sessions`.
   - `Marketplace`: `loads`, `load_stops`, `load_cargo_items`, `truck_offers`, `tenders`, `tender_bids`, `private_markets`, `market_participants`.
   - `Negotiation`: `negotiations`, `offers`.
   - `Transport`: `transport_orders`, `shipments`, `shipment_stops`, `shipment_events`, `shipment_exceptions`.
   - `Fleet`: `vehicles`, `trailers`, `drivers`, `driver_assignments`, `vehicle_maintenance`.
   - `Documents`: `documents`, `document_versions`, `signatures`, `document_packages`.
   - `Finance`: `invoices`, `invoice_items`, `payments`, `escrow_holds`, `settlement_records`.
   - `Trust`: `verifications`, `ratings`, `reviews`, `risk_scores`, `blacklists`.
   - `Communication`: `conversations`, `conversation_members`, `messages`, `attachments`, `notifications`.
   - `System`: `outbox_events`, `audit_logs`, `idempotency_keys`.

---

## Важные замечания для выполнения

- ER-диаграмма должна содержать все типы связей и внешние ключи.
- Документация должна служить полноценной спецификацией для создания миграций БД (Liquibase / Flyway / Goose).
