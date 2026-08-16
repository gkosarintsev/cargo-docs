# Промпт 14 — Каталог доменных и интеграционных событий (Event Catalog)

> **Файлы на выходе:**
>
> - `docs/04-domain/domain-events.md`

---

## Контекст

Формируем единый, исчерпывающий каталог событий логистической платформы (из §16 master-prompt).
События — это основа слабой связанности (loose coupling) между контекстами, реактивного обновления UI и интеграции с внешними системами.

Язык — **русский**. Формат описания — техническая спецификация с JSON-схемами полезной нагрузки (Payload).

---

## Задание: создай `docs/04-domain/domain-events.md`

### 1. Архитектурные соглашения по событиям

- **Разделение типов событий**:
  - _Domain Event_: внутри контекста (детальный, гранулярный, отражает факт в прошлом).
  - _Integration Event_: публикуется во внешнюю шину (Kafka) для других контекстов и внешних вебхуков (контрактная стабильность, версионирование).
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
- **Гарантии доставки и порядок**: семантика At-Least-Once, дедупликация на стороне потребителя по `event_id`, партиционирование Kafka по `aggregate_id` (гарантия строгой последовательности изменений конкретной сущности).

---

### 2. Каталог событий по контекстам

Для каждого события приведи:

- **Название события** (в прошедшем времени, например: `LoadPublished`, `OfferAccepted`)
- **Producer** (контекст-источник)
- **Consumers** (контексты-подписчики и их реакция)
- **Partition Key** в Kafka
- **Пример JSON-схемы Payload**
- **Требования к идемпотентности и DLQ-политика**

#### Обязательный перечень событий для спецификации:

1. **Marketplace & Tenders**:
   - `LoadPublished` (публикация груза → индексация в OpenSearch, matching)
   - `LoadUpdated`, `LoadExpired`, `LoadWithdrawn`
   - `TruckOfferPublished`, `TruckOfferUpdated`, `TruckOfferExpired`
   - `TenderCreated`, `TenderBidSubmitted`, `TenderClosed`

2. **Matching & Negotiation**:
   - `OfferSubmitted` (перевозчик предложил цену → уведомление грузовладельцу, открытие чата)
   - `CounterOfferSubmitted` (грузовладелец снизил ставку)
   - `OfferAccepted` (стороны договорились → триггер создания TransportOrder)
   - `OfferRejected`, `OfferExpired`

3. **Transport Order & Execution**:
   - `TransportOrderCreated` (создан юридический заказ)
   - `TransportOrderConfirmedByCarrier`
   - `VehicleAndDriverAssigned` (назначена конкретная фура и водитель)
   - `ShipmentStarted` (водитель нажал «Поехал на погрузку» или сработал геофенс)
   - `ShipmentArrivedAtPickup`, `ShipmentLoadingCompleted`
   - `ShipmentInTransit`
   - `ShipmentArrivedAtDelivery`, `ShipmentUnloaded`
   - `ShipmentDelivered`
   - `ShipmentExceptionOccurred` (ДТП, поломка, задержка > N часов, повреждение груза)
   - `DriverReplaced`, `VehicleReplaced`

4. **Location & Telematics**:
   - `GpsPositionBatchReceived`
   - `GeofenceEntered` (ТС въехало на склад)
   - `GeofenceExited` (ТС покинуло склад)
   - `RouteDeviated` (отклонение от заданного маршрута > 5 км)
   - `EtaUpdated` (пересчитано прогнозируемое время прибытия)

5. **Documents**:
   - `DocumentUploaded` (загружен скан/фото CMR)
   - `PodSubmitted` (водитель передал фото акта с подписью)
   - `DocumentSignedByCarrier`, `DocumentSignedByShipper` (электронная подпись)
   - `DocumentPackageReady`

6. **Billing & Finance**:
   - `InvoiceIssued` (выставлен счет за перевозку / комиссию)
   - `PaymentReceived` (подтверждена оплата)
   - `PaymentFailed`
   - `SettlementCompleted` (взаиморасчет закрыт)
   - `FactoringRequested`, `FactoringApproved`

7. **Trust & Reputation**:
   - `CompanyVerificationPassed`, `CompanyVerificationRevoked`
   - `RatingReviewSubmitted`
   - `RiskScoreRecalculated`

---

## Важные замечания для выполнения

- Удели особое внимание детальным JSON-структурам полезной нагрузки (Payload) для ключевых событий (`LoadPublished`, `OfferAccepted`, `ShipmentStatusChanged`, `PodSubmitted`).
- Избегай передачи огромных вложенных графов объектов в событии — передавай только измененные данные и идентификаторы (Lightweight Notification / Event-Carried State Transfer).
