# Промпт 16 — Sequence Diagrams и Core ERD

> **Файлы на выходе:**
>
> - `docs/04-domain/sequence-diagrams/publish-load.md`
> - `docs/04-domain/sequence-diagrams/accept-offer.md`
> - `docs/04-domain/sequence-diagrams/create-order.md`
> - `docs/04-domain/sequence-diagrams/assign-driver.md`
> - `docs/04-domain/sequence-diagrams/track-shipment.md`
> - `docs/04-domain/sequence-diagrams/complete-delivery.md`
> - `docs/04-domain/erd/core.md`

---

## Контекст

Завершаем раздел **04-domain**.
Создаем детальные диаграммы последовательности (Sequence Diagrams) для сквозных бизнес-процессов платформы и реляционную модель ядра (Core ERD).

Язык — **русский**. Диаграммы — **Mermaid** (`sequenceDiagram` и `erDiagram`).

---

## Задание 1: создай Sequence Diagrams (6 файлов)

Каждая sequence-диаграмма должна детально показывать:

- Участников взаимодействия (User UI, Mobile App, API Gateway, Application Service, Transactional Database, Transactional Outbox, Kafka, Consumers/Workers, External Systems).
- Транзакционные границы (блоки `opt`, `alt`, `critical`, `par`).
- Асинхронные шаги (пунктирные стрелки `-->` и публикацию событий).
- Обработку сетевых сбоев и откатов.

### Спецификации файлов:

1. **`publish-load.md` (Публикация груза)**:
   - Shipper UI → Gateway → LoadService (валидация, геокодинг адресов) → PostgreSQL (Insert Load + Outbox `LoadPublished`) → Commit → Outbox Worker → Kafka → OpenSearch Indexer (создание документа в индексе) → Notification Worker (поиск сохраненных подписок перевозчиков и пуш уведомлений).

2. **`accept-offer.md` (Торги и акцепт предложения)**:
   - Carrier UI → отправка Offer → Shipper UI получает Realtime обновление через WebSocket → отправляет Counter-Offer → Carrier акцептует → атомарная фиксация договоренности.

3. **`create-order.md` (Формирование транспортного заказа из акцептованного оффера)**:
   - Фиксация юридических реквизитов обеих компаний, стоимости, условий оплаты → генерация PDF договора-заявки → перевод груза в статус `BOOKED` → генерация события `TransportOrderCreated`.

4. **`assign-driver.md` (Назначение машины и водителя)**:
   - Диспетчер перевозчика выбирает ТС и водителя из автопарка → проверка доступности по календарю и документам (пропуск, ДОПОГ/ADR) → запись в рейс → Push-уведомление в водительское мобильное приложение → Водитель нажимает «Принять рейс».

5. **`track-shipment.md` (Сквозной трекинг и обработка геозон)**:
   - Driver App собирает GPS → Ingestion Gateway (HTTP 202) → Kafka `telemetry.raw` → Telemetry Processor → проверка попадания в полигон геозоны погрузки/разгрузки → обновление Redis (последняя точка) и TimescaleDB → WebSocket push диспетчеру на карту → при входе в геозону авто-переход статуса в `AT_PICKUP`.

6. **`complete-delivery.md` (Сдача груза, PoD и закрытие рейса)**:
   - Водитель на точке выгрузки делает фото подписанной накладной с печатями → загрузка в S3 → отправка PoD через приложение → Заказчик проверяет и подтверждает → автоматическое выставление счета перевозчику/платформе.

---

## Задание 2: создай `docs/04-domain/erd/core.md`

### Содержимое документа (Core Entity-Relationship Diagram)

1. Полная **Mermaid `erDiagram`** с типами связей (1:1, 1:N, N:M), обязательными первичными (`PK`) и внешними (`FK`) ключами.
2. Таблицы ядра системы:
   - `organizations` (id, name, inn, kpp, ogrn, legal_address, rating, verification_status, created_at)
   - `users` (id, organization_id, email, phone, full_name, role, password_hash, is_active)
   - `contacts` (id, organization_id, department_id, name, phone, email, is_primary)
   - `loads` (id, organization_id, status, title, price_amount, price_currency, vat_included, loading_type, body_type, weight_kg, volume_m3, pickup_date_from, pickup_date_to, delivery_date_from, delivery_date_to, created_at, version)
   - `load_stops` (id, load_id, stop_type, sequence_num, address_raw, lat, lon, city, country, contact_person, contact_phone)
   - `truck_offers` (id, organization_id, vehicle_id, driver_id, status, available_from, available_to, origin_lat, origin_lon, origin_radius_km)
   - `offers` (id, load_id, carrier_organization_id, price_amount, status, expires_at, created_at)
   - `negotiations` (id, load_id, carrier_id, shipper_id, current_offer_id, status)
   - `transport_orders` (id, negotiation_id, load_id, shipper_org_id, carrier_org_id, order_number, status, total_price, currency, created_at)
   - `shipments` (id, transport_order_id, carrier_org_id, vehicle_id, driver_id, status, planned_distance_km, started_at, completed_at)
   - `shipment_stops` (id, shipment_id, stop_type, sequence_num, lat, lon, planned_time, actual_arrival_time, actual_departure_time, status)
   - `vehicles` (id, organization_id, plate_number, make_model, body_type, max_weight_kg, max_volume_m3, has_gps, status)
   - `drivers` (id, organization_id, user_id, full_name, phone, license_number, status)
   - `documents` (id, entity_type, entity_id, doc_type, s3_bucket, s3_key, file_name, file_size, mime_type, sha256, status, uploaded_by_user_id)
   - `invoices` (id, order_id, organization_id, invoice_number, amount, vat_amount, status, due_date, paid_at)
   - `audit_logs` (id, organization_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
   - `outbox_events` (id, aggregate_type, aggregate_id, event_type, payload, status, created_at, published_at)

---

## Важные замечания для выполнения

- Диаграммы должны быть читаемыми, структурированными и строго соблюдать синтаксис Mermaid.
- ERD должна содержать точные типы данных (UUID, VARCHAR, NUMERIC, TIMESTAMP, JSONB).
