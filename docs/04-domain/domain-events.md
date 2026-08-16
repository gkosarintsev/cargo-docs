# Каталог доменных и интеграционных событий (Event Catalog)

## 1. Архитектурные соглашения по событиям

- **Разделение типов событий**:
  - _Domain Event_: события внутри ограниченного контекста. Отличаются высокой гранулярностью, содержат полную сущность или детали изменения, отражают факт в прошлом.
  - _Integration Event_: публикуются во внешнюю шину (Kafka) для других контекстов и внешних вебхуков. Характеризуются контрактной стабильностью, версионированием и минимально необходимым объемом данных (Lightweight Notification / Event-Carried State Transfer).
- **Стандартные метаданные события (Event Envelope / CloudEvents-совместимый)**:
  ```json
  {
    "event_id": "uuid-v4",
    "event_type": "marketplace.load.published.v1",
    "aggregate_id": "load-uuid",
    "aggregate_type": "Load",
    "timestamp": "2026-08-16T12:00:00Z",
    "producer": "marketplace-service",
    "tenant_id": "org-uuid",
    "user_id": "user-uuid",
    "trace_id": "trace-uuid",
    "schema_version": "1.0",
    "payload": { ... }
  }
  ```
- **Гарантии доставки и порядок**:
  - Используется семантика _At-Least-Once_.
  - Дедупликация выполняется на стороне потребителя (consumer) на основе `event_id`.
  - Строгая последовательность изменений конкретной сущности гарантируется партиционированием Kafka по ключу `aggregate_id`.

---

## 2. Каталог событий по контекстам

### 2.1. Marketplace & Tenders

#### `LoadPublished`

- **Producer**: Marketplace Service
- **Consumers**: Search Service (индексация в OpenSearch), Matching Service (подбор перевозчиков), Notification Service.
- **Partition Key**: `load_id`
- **Идемпотентность и DLQ**: Обработка идемпотентна по `event_id`. При ошибках индексации — retry (3 раза), затем отправка в `search-dlq` (Dead Letter Queue).
- **Payload Schema**:
  ```json
  {
    "load_id": "uuid",
    "shipper_id": "uuid",
    "origin": { "lat": 55.75, "lon": 37.61, "city": "Москва" },
    "destination": { "lat": 59.93, "lon": 30.31, "city": "Санкт-Петербург" },
    "weight_kg": 20000,
    "volume_m3": 82,
    "pickup_date": "2026-08-20T10:00:00Z",
    "required_equipment": ["TENT", "REFRIGERATOR"]
  }
  ```

#### `LoadUpdated`, `LoadExpired`, `LoadWithdrawn`

- **Producer**: Marketplace Service
- **Consumers**: Search Service, Matching Service.
- **Partition Key**: `load_id`
- **Идемпотентность и DLQ**: Стандартный retry, сброс кэша идемпотентен по `load_id`.
- **Payload Schema (LoadWithdrawn)**:
  ```json
  {
    "load_id": "uuid",
    "reason": "CANCELLED_BY_SHIPPER"
  }
  ```

#### `TruckOfferPublished`, `TruckOfferUpdated`, `TruckOfferExpired`

- **Producer**: Marketplace Service
- **Consumers**: Matching Service.
- **Partition Key**: `truck_offer_id`
- **Идемпотентность и DLQ**: Дедупликация на уровне `event_id`.

#### `TenderCreated`, `TenderBidSubmitted`, `TenderClosed`

- **Producer**: Tenders Service
- **Consumers**: Notification Service, Marketplace Service.
- **Partition Key**: `tender_id`
- **Идемпотентность и DLQ**: Идемпотентность создания сущностей по `event_id`.

---

### 2.2. Matching & Negotiation

#### `OfferSubmitted`

- **Producer**: Negotiation Service
- **Consumers**: Notification Service (уведомление грузовладельцу), Chat Service (создание/открытие чата).
- **Partition Key**: `negotiation_id`
- **Идемпотентность и DLQ**: Идемпотентное сохранение ставки в БД. Если уведомление не отправлено, повтор через встроенный механизм Notification Service.
- **Payload Schema**:
  ```json
  {
    "negotiation_id": "uuid",
    "load_id": "uuid",
    "carrier_id": "uuid",
    "proposed_price": {
      "amount": 50000,
      "currency": "RUB"
    },
    "vehicle_id": "uuid-optional"
  }
  ```

#### `CounterOfferSubmitted`

- **Producer**: Negotiation Service
- **Consumers**: Notification Service.
- **Partition Key**: `negotiation_id`
- **Идемпотентность и DLQ**: Аналогично `OfferSubmitted`.

#### `OfferAccepted`

- **Producer**: Negotiation Service
- **Consumers**: Transport Execution Service (триггер создания TransportOrder), Notification Service, Marketplace Service (снятие груза с публикации).
- **Partition Key**: `negotiation_id` (или `load_id`)
- **Идемпотентность и DLQ**: Критическое событие. Transport Execution Service должен гарантировать, что по одному `negotiation_id` создается только один заказ (Idempotency Key). При недоступности БД заказа — бесконечный retry, затем `order-dlq` с ручным разбором.
- **Payload Schema**:
  ```json
  {
    "negotiation_id": "uuid",
    "load_id": "uuid",
    "shipper_id": "uuid",
    "carrier_id": "uuid",
    "agreed_price": {
      "amount": 52000,
      "currency": "RUB"
    }
  }
  ```

#### `OfferRejected`, `OfferExpired`

- **Producer**: Negotiation Service
- **Consumers**: Notification Service.
- **Partition Key**: `negotiation_id`
- **Идемпотентность и DLQ**: Отправка уведомлений, retry по расписанию Notification.

---

### 2.3. Transport Order & Execution

#### `TransportOrderCreated`

- **Producer**: Transport Execution Service
- **Consumers**: Billing Service (создание черновика счета), Document Service (генерация драфта заявки).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Строгая идемпотентность по `transport_order_id` в Billing.

#### `TransportOrderConfirmedByCarrier`

- **Producer**: Transport Execution Service
- **Consumers**: Notification Service.
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Игнорирование дубликатов по `event_id`.

#### `VehicleAndDriverAssigned`

- **Producer**: Transport Execution Service
- **Consumers**: Telematics Service (начало трекинга), Document Service (добавление данных в путевой лист/заявку).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Обновление документов идемпотентно.

#### `ShipmentStarted`, `ShipmentArrivedAtPickup`, `ShipmentLoadingCompleted`

- **Producer**: Transport Execution Service
- **Consumers**: Notification Service, Telematics Service.
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Статус может обновляться только вперед, защита от race conditions на уровне БД.

#### `ShipmentInTransit`

- **Producer**: Transport Execution Service
- **Consumers**: Telematics Service (активация геофенсинга).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Обработка идемпотентна, включение геофенсинга.

#### `ShipmentArrivedAtDelivery`, `ShipmentUnloaded`, `ShipmentDelivered`

- **Producer**: Transport Execution Service
- **Consumers**: Notification Service, Billing Service (перевод статуса биллинга).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Перевод статуса биллинга строго идемпотентен (проверка текущего статуса счета).
- **Payload Schema (ShipmentStatusChanged - универсальный)**:
  ```json
  {
    "transport_order_id": "uuid",
    "previous_status": "IN_TRANSIT",
    "new_status": "ARRIVED_AT_DELIVERY",
    "location": { "lat": 59.93, "lon": 30.31 },
    "changed_by": "driver_user_id"
  }
  ```

#### `ShipmentExceptionOccurred`

- **Producer**: Transport Execution Service
- **Consumers**: Notification Service, Trust & Reputation Service.
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Оповещение поддержки. В случае сбоев направляется в priority DLQ.

#### `DriverReplaced`, `VehicleReplaced`

- **Producer**: Transport Execution Service
- **Consumers**: Telematics Service, Document Service.
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Перегенерация документов при необходимости.

---

### 2.4. Location & Telematics

#### `GpsPositionBatchReceived`

- **Producer**: Telematics Service
- **Consumers**: Analytics Service, Transport Execution Service (через агрегированные события).
- **Partition Key**: `vehicle_id`
- **Идемпотентность и DLQ**: Массовые события, возможна потеря данных, Time-series DB использует upsert по `timestamp` и `vehicle_id`.

#### `GeofenceEntered`, `GeofenceExited`

- **Producer**: Telematics Service
- **Consumers**: Transport Execution Service (автоматическое изменение статусов прибытия/отбытия).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Transport Execution проверяет текущий статус перед обновлением, игнорируя дубли.
- **Payload Schema (GeofenceEntered)**:
  ```json
  {
    "vehicle_id": "uuid",
    "transport_order_id": "uuid",
    "location_id": "uuid",
    "location_type": "PICKUP",
    "timestamp": "2026-08-16T15:30:00Z"
  }
  ```

#### `RouteDeviated`, `EtaUpdated`

- **Producer**: Telematics Service
- **Consumers**: Transport Execution Service, Notification Service.
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Перезапись последнего ETA идемпотентна.

---

### 2.5. Documents

#### `DocumentUploaded`

- **Producer**: Document Service
- **Consumers**: OCR Service (распознавание текста), Transport Execution Service.
- **Partition Key**: `document_id`
- **Идемпотентность и DLQ**: OCR запускается только если результат еще не получен.

#### `PodSubmitted`

- **Producer**: Document Service
- **Consumers**: Transport Execution Service, Billing Service (инициация оплаты).
- **Partition Key**: `transport_order_id`
- **Идемпотентность и DLQ**: Критическое событие для финансов. Идемпотентность по `document_id` в Billing.
- **Payload Schema**:
  ```json
  {
    "document_id": "uuid",
    "transport_order_id": "uuid",
    "document_type": "POD",
    "file_url": "s3://bucket/path/pod.pdf",
    "submitted_by": "user_id"
  }
  ```

#### `DocumentSignedByCarrier`, `DocumentSignedByShipper`, `DocumentPackageReady`

- **Producer**: Document Service
- **Consumers**: Billing Service.
- **Partition Key**: `document_group_id`
- **Идемпотентность и DLQ**: Смена статусов документа, идемпотентная обработка в Billing.

---

### 2.6. Billing & Finance

#### `InvoiceIssued`

- **Producer**: Billing Service
- **Consumers**: Notification Service.
- **Partition Key**: `invoice_id`
- **Идемпотентность и DLQ**: Стандартная защита от дублей.

#### `PaymentReceived`, `PaymentFailed`

- **Producer**: Billing Service
- **Consumers**: Transport Execution Service, Trust & Reputation Service.
- **Partition Key**: `invoice_id`
- **Идемпотентность и DLQ**: Перевод статуса заказа в оплачен, идемпотентный update.

#### `SettlementCompleted`

- **Producer**: Billing Service
- **Consumers**: Reporting Service.
- **Partition Key**: `settlement_id`
- **Идемпотентность и DLQ**: Запись в аналитику.

#### `FactoringRequested`, `FactoringApproved`

- **Producer**: Billing Service
- **Consumers**: External Bank Webhook, Notification Service.
- **Partition Key**: `invoice_id`
- **Идемпотентность и DLQ**: Retry для внешних вебхуков с экспоненциальной задержкой.

---

### 2.7. Trust & Reputation

#### `CompanyVerificationPassed`, `CompanyVerificationRevoked`

- **Producer**: Trust Service
- **Consumers**: Marketplace Service (снятие блокировки / блокировка пользователя).
- **Partition Key**: `company_id`
- **Идемпотентность и DLQ**: Обновление статуса компании в профиле идемпотентно.

#### `RatingReviewSubmitted`

- **Producer**: Trust Service
- **Consumers**: Analytics Service, Marketplace Service (обновление отображаемого рейтинга).
- **Partition Key**: `review_id`
- **Идемпотентность и DLQ**: Upsert в агрегат рейтинга.

#### `RiskScoreRecalculated`

- **Producer**: Trust Service
- **Consumers**: Negotiation Service (учет риска при сделках).
- **Partition Key**: `company_id`
- **Идемпотентность и DLQ**: Перезапись значения `risk_score` идемпотентна.
