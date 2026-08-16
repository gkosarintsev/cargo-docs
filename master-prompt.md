# Master Prompt: проектирование технической документации логистической платформы

Ты выступаешь одновременно в роли:

* Principal Software Architect;
* Domain Architect в области logistics / freight transportation;
* Business Analyst;
* Enterprise Architect;
* API Architect;
* специалиста по distributed systems;
* технического писателя.

Твоя задача — спроектировать **полный каркас технической документации для современной цифровой логистической платформы**, похожей по бизнес-модели на ATI.SU, Trans.eu, TIMOCOM, DAT Freight & Analytics и современные digital freight marketplaces.

Документация должна быть пригодна как основа для реального production-проекта, а не как учебный пример.

---

# 1. Контекст продукта

Проектируем платформу, которая объединяет участников рынка автомобильных грузоперевозок:

* грузовладельцев / shippers;
* экспедиторов / freight forwarders;
* перевозчиков / carriers;
* транспортные компании;
* автопарки;
* водителей;
* диспетчеров;
* сотрудников компаний;
* доверенных контрагентов;
* администраторов платформы;
* внешние TMS/ERP/WMS системы.

Основная бизнес-модель:

> Грузовладелец или экспедитор публикует груз → перевозчики находят груз → предлагают транспорт/цену → стороны договариваются → создаётся транспортный заказ → перевозка выполняется → местоположение и статусы отслеживаются → документы передаются → перевозка закрывается → производится расчёт и формируется история взаимоотношений.

Но платформа должна поддерживать также обратный сценарий:

> Перевозчик публикует свободную машину → грузовладелец/экспедитор ищет подходящий транспорт → отправляет предложение → заключается договорённость → создаётся заказ.

---

# 2. Используй реальные аналоги как domain references

При проектировании используй следующие системы как референсы бизнес-функциональности:

## ATI.SU

Исследуй и учитывай концепции:

* Loads / Грузы;
* Trucks / Машины;
* Orders / Заказы;
* Companies / Фирмы;
* Contacts;
* Boards / Площадки;
* public marketplace;
* private marketplace;
* counter-offers;
* comments;
* tenders;
* electronic documents;
* GPS monitoring;
* driver application;
* company verification;
* ratings/reputation;
* freight price index;
* API;
* user dictionaries;
* transport statuses.

Не копируй внутреннюю реализацию ATI.SU.

Изучи публичную документацию ATI.SU API и используй её только как источник для понимания предметной области и пользовательских сценариев.

## Trans.eu

Особенно учитывай:

* public freight exchange;
* private freight exchange;
* trusted carrier networks;
* carrier verification;
* automatic freight assignment;
* load/carrier matching;
* price estimation;
* messenger;
* transport execution;
* GPS monitoring;
* eCMR / documents;
* TMS integration;
* API;
* multi-branch organizations.

## TIMOCOM

Учитывай:

* Freight Exchange;
* Transport Orders;
* Live Shipment Tracking;
* GPS providers;
* company profiles;
* freight price insights;
* REST API;
* интеграцию с TMS/ERP.

## DAT

Учитывай:

* load board;
* carrier/broker discovery;
* ratings;
* company scores;
* payment history;
* market rates;
* analytics;
* trust/risk information.

## Uber Freight и аналогичные digital freight platforms

Используй как reference для:

* digital booking;
* shipment execution;
* multi-stop shipments;
* real-time visibility;
* carrier management;
* automated workflows;
* pricing;
* financial workflow.

---

# 3. Главный принцип

Не пытайся сразу выбрать конкретные технологии.

Сначала:

1. определить business domain;
2. определить bounded contexts;
3. определить actors;
4. определить entities;
5. определить бизнес-процессы;
6. определить state machines;
7. определить требования;
8. определить интеграции;
9. определить архитектурные границы;
10. только после этого выбрать архитектурный стиль и технологии.

Не следует автоматически проектировать микросервисную архитектуру только потому, что система high-load.

Для каждого bounded context объясняй:

* зачем он существует;
* какая у него ответственность;
* какие данные ему принадлежат;
* какие данные он не должен изменять;
* какие API предоставляет;
* какие события публикует;
* какие события потребляет;
* какие требования к консистентности;
* какой характер нагрузки;
* нужна ли отдельная БД;
* почему этот context должен/не должен быть отдельным deployment unit.

---

# 4. Требуемая структура документации

Создай рекомендуемую структуру `docs/`.

Она должна быть значительно подробнее исходного примера.

Предпочтительная структура:

```text
docs/
├── README.md
├── glossary/
│
├── 01-product-and-domain/
│   ├── product-overview.md
│   ├── actors-and-roles.md
│   ├── business-capabilities.md
│   ├── business-model.md
│   ├── domain-map.md
│   ├── bounded-contexts.md
│   └── glossary.md
│
├── 02-requirements/
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   ├── scalability.md
│   ├── availability.md
│   ├── security.md
│   ├── observability.md
│   ├── compliance.md
│   └── disaster-recovery.md
│
├── 03-architecture/
│   ├── architecture-overview.md
│   ├── principles.md
│   ├── system-context.md
│   ├── deployment-model.md
│   ├── data-architecture.md
│   ├── integration-architecture.md
│   ├── security-architecture.md
│   │
│   ├── c4/
│   │   ├── 01-system-context.puml
│   │   ├── 02-containers.puml
│   │   ├── 03-components/
│   │   └── 04-code/
│   │
│   ├── adr/
│   │   ├── 0000-template.md
│   │   └── ...
│   │
│   └── views/
│       ├── logical-view.md
│       ├── runtime-view.md
│       ├── deployment-view.md
│       └── data-flow-view.md
│
├── 04-domain/
│   ├── domain-model.md
│   ├── aggregates.md
│   ├── entities.md
│   ├── value-objects.md
│   ├── domain-events.md
│   ├── invariants.md
│   ├── policies.md
│   ├── state-machines/
│   ├── sequence-diagrams/
│   └── erd/
│
├── 05-business-processes/
│   ├── bpmn/
│   ├── use-cases/
│   ├── workflows/
│   └── exception-flows/
│
├── 06-marketplace/
│   ├── load-marketplace.md
│   ├── truck-marketplace.md
│   ├── matching.md
│   ├── search.md
│   ├── ranking.md
│   ├── recommendations.md
│   ├── counter-offers.md
│   ├── negotiation.md
│   ├── private-marketplaces.md
│   └── tendering.md
│
├── 07-transport-execution/
│   ├── transport-order.md
│   ├── assignment.md
│   ├── pickup.md
│   ├── transit.md
│   ├── delivery.md
│   ├── exceptions.md
│   ├── statuses.md
│   ├── tracking.md
│   └── proof-of-delivery.md
│
├── 08-companies-and-trust/
│   ├── company-profile.md
│   ├── verification.md
│   ├── ratings.md
│   ├── reputation.md
│   ├── risk-scoring.md
│   ├── payment-history.md
│   └── permissions.md
│
├── 09-fleet/
│   ├── vehicles.md
│   ├── trailers.md
│   ├── drivers.md
│   ├── fleets.md
│   ├── availability.md
│   └── vehicle-driver-assignment.md
│
├── 10-location-and-routing/
│   ├── addresses.md
│   ├── geocoding.md
│   ├── routing.md
│   ├── distance-calculation.md
│   ├── geo-indexing.md
│   ├── gps-ingestion.md
│   └── tracking.md
│
├── 11-documents/
│   ├── document-management.md
│   ├── e-documents.md
│   ├── document-types.md
│   ├── signatures.md
│   ├── document-lifecycle.md
│   └── retention.md
│
├── 12-finance/
│   ├── pricing.md
│   ├── freight-rates.md
│   ├── commissions.md
│   ├── invoices.md
│   ├── payments.md
│   ├── guarantees.md
│   ├── factoring.md
│   └── financial-events.md
│
├── 13-communication/
│   ├── messenger.md
│   ├── notifications.md
│   ├── email.md
│   ├── sms.md
│   ├── push.md
│   └── realtime.md
│
├── 14-api/
│   ├── api-guidelines.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── versioning.md
│   ├── idempotency.md
│   ├── pagination.md
│   ├── errors.md
│   ├── rate-limits.md
│   │
│   ├── openapi/
│   ├── asyncapi/
│   └── proto/
│
├── 15-data/
│   ├── data-model.md
│   ├── ownership.md
│   ├── consistency.md
│   ├── replication.md
│   ├── retention.md
│   ├── archival.md
│   ├── migrations.md
│   ├── search-index.md
│   └── erd/
│
├── 16-integrations/
│   ├── tms/
│   ├── erp/
│   ├── wms/
│   ├── gps/
│   ├── maps/
│   ├── payment-providers/
│   ├── e-document-providers/
│   ├── identity-verification/
│   └── external-marketplaces/
│
├── 17-security/
│   ├── threat-model.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── tenant-isolation.md
│   ├── secrets.md
│   ├── encryption.md
│   ├── audit-log.md
│   ├── abuse-prevention.md
│   └── security-events.md
│
├── 18-observability/
│   ├── logging.md
│   ├── metrics.md
│   ├── tracing.md
│   ├── alerts.md
│   ├── dashboards.md
│   └── slo.md
│
├── 19-operations/
│   ├── deployment.md
│   ├── environments.md
│   ├── ci-cd.md
│   ├── backups.md
│   ├── disaster-recovery.md
│   ├── runbooks/
│   └── incident-management.md
│
├── 20-ui/
│   ├── user-flows/
│   ├── screen-contracts/
│   ├── permissions/
│   └── realtime-ui.md
│
└── 21-testing/
    ├── test-strategy.md
    ├── unit-tests.md
    ├── integration-tests.md
    ├── contract-tests.md
    ├── e2e-tests.md
    ├── load-tests.md
    ├── chaos-tests.md
    └── test-data.md
```

---

# 5. Domain model

Сформируй подробную domain model.

Минимально рассмотри следующие сущности:

### Identity

* User
* Contact
* Organization
* Department
* Role
* Permission
* Session
* API Client

### Marketplace

* Load
* Truck Offer
* Freight Offer
* Counter Offer
* Negotiation
* Marketplace
* Private Marketplace
* Marketplace Participant
* Tender
* Bid

### Transport

* Transport Order
* Shipment
* Route
* Stop
* Pickup
* Delivery
* Cargo
* Cargo Item
* Transport Status
* Exception

### Fleet

* Vehicle
* Trailer
* Driver
* Fleet
* Driver Assignment
* Vehicle Availability

### Trust

* Company Verification
* Rating
* Review
* Reputation Score
* Risk Score
* Payment History

### Tracking

* GPS Device
* Tracking Session
* Position
* Geofence
* Route Progress
* Tracking Event

### Documents

* Document
* Document Version
* Document Type
* Signature
* Document Package
* Proof of Delivery

### Finance

* Price
* Rate
* Commission
* Invoice
* Payment
* Guarantee
* Financial Transaction

### Communication

* Conversation
* Message
* Notification
* Subscription

Не считай перечисленные сущности автоматически правильными.

Проанализируй:

* какие из них являются Entity;
* какие Value Object;
* какие Aggregate Root;
* какие Projection;
* какие read models;
* какие события;
* какие данные должны принадлежать конкретному bounded context.

---

# 6. Самое важное — различить бизнес-сущности

Особенно подробно опиши различия:

```text
Load
    ↓
Offer / Counter Offer
    ↓
Negotiation
    ↓
Transport Order
    ↓
Shipment
    ↓
Execution
    ↓
Delivery
    ↓
Proof of Delivery
    ↓
Settlement
```

Объясни, почему это не должна быть одна сущность `Order`.

Отдельно объясни отношения:

```text
Organization
 ├── Contacts
 ├── Departments
 ├── Fleets
 │    ├── Vehicles
 │    ├── Trailers
 │    └── Drivers
 └── Marketplaces
      └── Participants
```

---

# 7. Marketplace

Спроектируй marketplace как отдельный домен.

Не ограничивайся CRUD для грузов.

Опиши:

* публикацию груза;
* поиск;
* фильтрацию;
* полнотекстовый поиск;
* geo-search;
* поиск по маршрутам;
* поиск по дате;
* поиск по типу кузова;
* поиск по грузоподъёмности;
* поиск по температурному режиму;
* поиск по документам;
* ranking;
* relevance;
* recommendation;
* matching;
* duplicate detection;
* fraud detection;
* counter offers;
* negotiation;
* reservation;
* expiration;
* automatic unpublishing.

Опиши отдельно:

### Public marketplace

Груз виден всем подходящим участникам.

### Private marketplace

Груз доступен только определённой группе перевозчиков.

### Closed tender

Груз публикуется среди заранее определённых участников.

Продумай модель ACL/RBAC для этих сценариев.

---

# 8. Matching engine

Спроектируй matching engine.

Рассмотри matching:

```text
Load ↔ Truck
Load ↔ Carrier
Load ↔ Carrier + Vehicle + Driver
Load ↔ Route capacity
```

Критерии:

* origin;
* destination;
* radius;
* pickup date;
* delivery date;
* vehicle type;
* capacity;
* volume;
* cargo type;
* temperature;
* ADR/special requirements;
* carrier eligibility;
* reputation;
* price;
* route compatibility;
* empty mileage;
* historical behavior.

Раздели:

1. hard constraints;
2. soft constraints;
3. ranking score.

Опиши алгоритм как отдельный компонент.

Не привязывай его сразу к ML.

Сначала предложи deterministic/rule-based scoring.

После этого опиши возможное развитие до ML/recommendation system.

---

# 9. Search architecture

Отдельно спроектируй search subsystem.

Рассмотри:

* transactional database;
* search index;
* Elasticsearch/OpenSearch или аналог;
* geo queries;
* denormalized documents;
* indexing pipeline;
* eventual consistency;
* reindexing;
* partial updates;
* deleted documents;
* stale index;
* search relevance;
* sorting;
* faceted search.

Объясни:

> Почему marketplace search не должен выполнять сложные запросы непосредственно к transactional DB.

---

# 10. Location / GIS

Спроектируй географический subsystem.

Он должен поддерживать:

* countries;
* regions;
* cities;
* addresses;
* coordinates;
* geocoding;
* reverse geocoding;
* route calculation;
* distance matrix;
* route geometry;
* pickup/delivery radius;
* geofencing;
* GPS tracking.

Сравни:

* PostGIS;
* geohash;
* H3;
* Elasticsearch geo indexes.

Не выбирай H3 автоматически.

Объясни, где какой механизм лучше.

---

# 11. GPS tracking

Спроектируй высоконагруженный поток:

```text
Driver App / GPS Device
        ↓
Tracking Gateway
        ↓
Ingestion
        ↓
Event Stream
        ↓
Tracking Processor
        ↓
Current Position
        ↓
Historical Positions
        ↓
WebSocket / SSE
        ↓
Dispatcher UI
```

Опиши:

* frequency;
* batching;
* unreliable mobile network;
* duplicate positions;
* out-of-order events;
* device clock;
* server timestamp;
* GPS accuracy;
* invalid coordinates;
* offline buffering;
* reconnect;
* current position;
* historical track;
* retention;
* map rendering.

Отдельно опиши отличие:

```text
current state
vs
event history
vs
analytical time series
```

---

# 12. Transport execution

Создай state machine перевозки.

Например:

```text
CREATED
  ↓
ASSIGNED
  ↓
ACCEPTED
  ↓
DRIVER_ASSIGNED
  ↓
EN_ROUTE_TO_PICKUP
  ↓
AT_PICKUP
  ↓
LOADING
  ↓
LOADED
  ↓
IN_TRANSIT
  ↓
AT_DELIVERY
  ↓
UNLOADING
  ↓
DELIVERED
  ↓
DOCUMENTS_PENDING
  ↓
COMPLETED
```

Но не принимай этот список без анализа.

Определи:

* допустимые переходы;
* кто может инициировать переход;
* какие события создаются;
* какие переходы автоматические;
* какие требуют подтверждения;
* какие являются terminal states;
* как обрабатываются отмена;
* поломка;
* опоздание;
* отказ перевозчика;
* смена машины;
* смена водителя;
* partial delivery;
* failed delivery;
* return.

---

# 13. Orders vs Shipments

Очень важно отдельно исследовать и документировать:

* коммерческий заказ;
* транспортный заказ;
* shipment;
* cargo;
* route;
* leg;
* stop.

Определи, может ли:

```text
1 Order → N Shipments
1 Shipment → N Stops
1 Shipment → N Cargo Items
```

и как это влияет на архитектуру.

---

# 14. Companies and trust

Спроектируй систему доверия.

Учитывай:

* юридические данные;
* документы;
* verification;
* ownership;
* company relations;
* rating;
* reviews;
* complaints;
* payment behavior;
* cancellation behavior;
* delivery history;
* fraud signals;
* risk score.

Опиши, какие данные публичны, какие видны только контрагентам, а какие только внутренней risk/compliance системе.

---

# 15. Multi-tenancy

Система должна поддерживать компании с:

```text
Organization
 ├── Departments
 ├── Users
 ├── Contacts
 ├── Fleets
 ├── Marketplaces
 ├── Orders
 └── Billing
```

Опиши:

* tenant isolation;
* organization-level permissions;
* department-level permissions;
* resource ownership;
* delegated access;
* service accounts;
* API clients;
* audit trail.

Сравни:

* shared database / tenant_id;
* schema-per-tenant;
* database-per-tenant.

Выбери подход и объясни почему.

---

# 16. Event-driven architecture

Определи domain events.

Например:

```text
LoadPublished
LoadUpdated
LoadExpired
OfferCreated
OfferAccepted
OfferRejected

TransportOrderCreated
TransportOrderAccepted
DriverAssigned
VehicleAssigned

ShipmentStarted
ShipmentStatusChanged
GpsPositionReceived
ShipmentDelivered

DocumentUploaded
DocumentSigned

InvoiceCreated
PaymentReceived
```

Для каждого события укажи:

* producer;
* consumers;
* payload;
* ordering requirements;
* delivery semantics;
* idempotency;
* retry;
* dead-letter handling;
* retention.

---

# 17. API

Создай API architecture.

REST API должен включать:

```text
/auth
/organizations
/contacts
/vehicles
/drivers
/fleets

/loads
/truck-offers
/offers
/negotiations

/marketplaces
/marketplaces/{id}/participants

/orders
/shipments
/stops

/tracking
/positions

/documents
/invoices
/payments

/companies
/ratings
```

Для каждого ресурса продумай:

* CRUD;
* filtering;
* sorting;
* pagination;
* cursor pagination;
* idempotency;
* optimistic locking;
* authorization;
* versioning;
* errors;
* rate limits.

---

# 18. API integration

Отдельно спроектируй внешнее API для:

* TMS;
* ERP;
* WMS;
* accounting systems;
* GPS providers;
* telematics;
* map providers;
* document providers;
* payment providers.

Поддержи:

```text
REST
Webhooks
Async events
OAuth2
API keys
Service accounts
```

Документируй webhook delivery:

```text
event generated
→ queue
→ delivery
→ retry
→ exponential backoff
→ dead letter
```

Опиши webhook signature и replay protection.

---

# 19. Data architecture

Определи:

* transactional storage;
* search storage;
* cache;
* object storage;
* event streaming;
* analytical storage;
* time-series storage.

Не используй одну БД для всего.

Сформируй таблицу:

| Тип данных         | Storage | Причина |
| ------------------ | ------- | ------- |
| Orders             | ...     | ...     |
| Marketplace search | ...     | ...     |
| GPS history        | ...     | ...     |
| Documents          | ...     | ...     |
| Events             | ...     | ...     |
| Analytics          | ...     | ...     |

---

# 20. Consistency

Для каждой критической операции классифицируй:

* strong consistency;
* eventual consistency;
* read-your-writes;
* idempotent processing.

Особенно рассмотрим:

```text
Load publication
Offer acceptance
Order creation
Vehicle assignment
Payment
Document signing
GPS position
Search indexing
Notifications
```

Отдельно опиши проблему:

> Что произойдёт, если пользователь принял предложение, но search index или notification service ещё не получили событие?

---

# 21. Concurrency

Продумай конкурентные сценарии:

### Два перевозчика одновременно принимают один груз

### Диспетчер и API одновременно меняют заказ

### Один водитель назначен на две перевозки

### Машина уже занята, но search index показывает её свободной

### Пользователь повторяет POST после timeout

### Webhook доставлен дважды

### GPS-событие пришло в неправильном порядке

Для каждого сценария предложи защиту.

---

# 22. Payments

Не смешивай marketplace order и financial transaction.

Спроектируй:

```text
Quote
→ Agreement
→ Invoice
→ Payment
→ Settlement
```

Рассмотри:

* commission;
* platform fee;
* payment provider;
* guarantee;
* escrow-like mechanisms;
* factoring;
* refund;
* chargeback;
* reconciliation.

Финансовые операции должны иметь auditability и idempotency.

---

# 23. Documents

Документируй:

* CMR;
* waybill;
* invoice;
* acceptance act;
* proof of delivery;
* photos;
* scans;
* electronic signature.

Для документов рассмотри:

```text
Document
DocumentVersion
DocumentPackage
Signature
DocumentStatus
```

Файлы хранятся в object storage, а metadata — в transactional DB.

---

# 24. Communication

Спроектируй messenger.

Учитывай:

* conversation;
* participants;
* messages;
* attachments;
* read status;
* delivery status;
* moderation;
* audit;
* message retention;
* WebSocket;
* offline delivery.

Отдельно рассмотрите связь:

```text
Load ↔ Conversation
Offer ↔ Conversation
Order ↔ Conversation
```

---

# 25. Notifications

Спроектируй notification service.

Каналы:

* WebSocket;
* push;
* email;
* SMS;
* in-app.

Событие:

```text
OrderAssigned
```

может привести к:

```text
PushNotification
EmailNotification
WebNotification
```

Не связывай domain service непосредственно с SMTP/SMS provider.

---

# 26. Security

Сформируй threat model.

Минимально рассмотрите:

* account takeover;
* fake companies;
* fake loads;
* fake carriers;
* scraping;
* spam;
* marketplace manipulation;
* credential theft;
* privilege escalation;
* tenant isolation;
* malicious files;
* webhook forgery;
* replay attacks;
* API abuse;
* brute force;
* data leakage.

Создай:

```text
security/threat-model.md
security/authorization.md
security/audit-log.md
security/abuse-prevention.md
```

---

# 27. Observability

Спроектируй:

### Logs

Structured JSON logs.

### Metrics

Например:

```text
loads.published
loads.search.requests
offers.created
offers.accepted
orders.created
orders.completed
gps.positions.received
gps.positions.delayed
api.requests
api.errors
```

### Tracing

Проследи:

```text
POST /loads
→ Load Service
→ Event Bus
→ Search Indexer
→ Notification Service
```

Создай SLI/SLO.

---

# 28. High-load

Не придумывай произвольные цифры.

Сначала сформируй модель нагрузки:

```text
registered organizations
active users
active vehicles
loads/day
offers/day
orders/day
GPS devices
GPS updates/minute
API requests/sec
search requests/sec
messages/sec
documents/day
```

После этого сформируй:

* average RPS;
* peak RPS;
* burst;
* storage growth;
* network traffic;
* event throughput.

Используй минимум три сценария:

```text
Normal
Peak
Extreme / marketing-event / seasonal
```

---

# 29. Scalability

Для каждого subsystem определи scaling dimension.

Например:

```text
API → horizontal
Search → shard/index based
GPS ingestion → partition based
Kafka → partition based
PostgreSQL → read replicas / partitioning
Object storage → practically horizontal
Analytics → columnar storage
```

Не используй слово "масштабируемо" без объяснения, **что именно масштабируется и по какой оси**.

---

# 30. Failure scenarios

Создай отдельную документацию для:

* database unavailable;
* Kafka unavailable;
* search unavailable;
* cache unavailable;
* GPS provider unavailable;
* map provider unavailable;
* payment provider unavailable;
* document provider unavailable;
* notification provider unavailable.

Для каждого:

```text
failure
→ detection
→ degradation
→ retry
→ fallback
→ recovery
```

---

# 31. Disaster Recovery

Определи:

* RPO;
* RTO;
* backups;
* restore;
* cross-zone;
* cross-region;
* disaster scenarios.

Отдельно классифицируй данные:

### Critical

Orders / payments / company data.

### Recoverable

Search indexes.

### Ephemeral

Cache.

---

# 32. Testing

Создай strategy:

```text
Unit
Integration
Contract
Component
E2E
Load
Stress
Soak
Chaos
Security
```

Особенно важны contract tests для:

```text
REST
Webhooks
Kafka events
gRPC
External integrations
```

---

# 33. ADR

Создай ADR для наиболее важных решений.

Минимально:

```text
ADR-0001 Architecture style
ADR-0002 PostgreSQL
ADR-0003 Search engine
ADR-0004 Event streaming
ADR-0005 Object storage
ADR-0006 API style
ADR-0007 Authentication
ADR-0008 Multi-tenancy
ADR-0009 GPS ingestion architecture
ADR-0010 Marketplace matching
ADR-0011 Transactional outbox
ADR-0012 Distributed idempotency
ADR-0013 Cache strategy
ADR-0014 Observability
ADR-0015 Deployment topology
```

Для каждого ADR:

```text
Context
Problem
Decision
Alternatives
Consequences
Risks
Migration
```

---

# 34. Диаграммы

Все диаграммы должны быть diagrams-as-code.

Используй:

* PlantUML;
* Mermaid;
* BPMN 2.0.

Минимальный набор:

### C4

```text
System Context
Container
Component
```

### Sequence

```text
Publish Load
Search Load
Create Offer
Accept Offer
Create Order
Assign Driver
Track Shipment
Complete Shipment
```

### BPMN

```text
Load-to-Order
Order Execution
Tender
Private Marketplace
Carrier Onboarding
Document Flow
Payment Flow
Exception Handling
```

### State machines

```text
Load
Offer
Negotiation
Order
Shipment
Driver
Vehicle
Document
Payment
```

---

# 35. UI

Документируй не дизайн, а behavior contracts.

Для каждой ключевой страницы:

```text
Screen
↓
User action
↓
API
↓
State transition
↓
Event
↓
Realtime update
```

Минимальные интерфейсы:

### Shipper

* dashboard;
* create load;
* load search;
* load details;
* offers;
* carrier selection;
* orders;
* shipment tracking;
* documents;
* company management.

### Carrier

* available loads;
* truck offers;
* load details;
* offer creation;
* orders;
* driver assignment;
* tracking;
* documents.

### Dispatcher

* transport board;
* active shipments;
* map;
* driver status;
* exceptions;
* communication.

### Admin

* companies;
* verification;
* moderation;
* disputes;
* platform analytics;
* audit log.

---

# 36. Не делай следующие ошибки

Не:

* копируй ATI.SU;
* создавай один giant `Order` aggregate;
* помещай GPS coordinates в таблицу orders;
* используй PostgreSQL как поисковый движок marketplace;
* делай Kafka source of truth для всех business entities;
* делай microservice для каждой таблицы;
* связывай сервисы прямыми SQL-запросами;
* делай synchronous chain из 7 микросервисов для простого действия;
* создавай event-driven architecture без определения ownership;
* называй всё "eventual consistency";
* вводи distributed transactions без необходимости;
* используй Redis как основное persistent storage;
* смешивай domain event и integration event;
* делай API без idempotency;
* игнорируй duplicate delivery;
* игнорируй out-of-order GPS events;
* проектируй high-load без модели нагрузки.

---

# 37. Что должно быть результатом

В результате создай:

1. дерево `docs/`;
2. описание каждого файла;
3. domain model;
4. bounded contexts;
5. C4 architecture;
6. основные sequence diagrams;
7. BPMN;
8. state machines;
9. API structure;
10. event catalog;
11. data model;
12. security model;
13. NFR;
14. scalability model;
15. observability model;
16. disaster recovery;
17. ADR catalog;
18. testing strategy.

---

# 38. Формат ответа

Не пытайся написать все документы сразу.

Работай итеративно.

## Этап 1

Сначала выдай:

* анализ предметной области;
* список actors;
* business capabilities;
* domain map;
* bounded contexts;
* основные business processes;
* основные сущности;
* спорные места, требующие решения;
* рекомендуемую структуру `docs/`.

## Этап 2

После согласования domain model создай:

* C4;
* architecture overview;
* deployment model;
* data architecture;
* integration architecture.

## Этап 3

Затем:

* state machines;
* BPMN;
* sequence diagrams;
* domain events.

## Этап 4

Затем:

* OpenAPI;
* AsyncAPI;
* gRPC contracts;
* webhook contracts.

## Этап 5

Затем:

* ERD;
* data ownership;
* indexes;
* consistency;
* retention.

## Этап 6

Затем:

* security;
* observability;
* SLO;
* disaster recovery;
* testing.

## Этап 7

Затем:

* UI contracts;
* screen flows;
* operational runbooks.

---

# 39. Правило качества

Каждое архитектурное решение должно отвечать на вопрос:

> "Почему именно так?"

Для существенных решений показывай минимум 2–3 альтернативы.

Например:

```text
PostgreSQL vs MongoDB
Kafka vs RabbitMQ
OpenSearch vs PostgreSQL FTS
REST vs gRPC
WebSocket vs SSE
H3 vs PostGIS
Redis vs local cache
Microservices vs modular monolith
```

Не выбирай технологию из-за популярности.

Связывай выбор с:

* workload;
* consistency;
* latency;
* operational complexity;
* team size;
* cost;
* failure model;
* data ownership.

---

# 40. Особое требование: MVP vs Evolution

Архитектура должна иметь минимум три стадии:

```text
Phase 1 — MVP
Phase 2 — Growth
Phase 3 — Large Scale
```

Например:

### MVP

Modular monolith + PostgreSQL + Redis + OpenSearch + object storage.

### Growth

Выделение:

* search;
* tracking;
* notifications;
* documents;
* marketplace.

### Large Scale

Выделение высоконагруженных bounded contexts:

* marketplace/search;
* matching;
* GPS ingestion;
* messaging;
* notifications;
* analytics.

Для каждого перехода объясни:

* какой bottleneck появляется;
* почему существующая архитектура перестаёт работать;
* что именно выделяется;
* как мигрируются данные;
* как сохраняется backward compatibility.

---

# 41. Итоговая философия архитектуры

Проектируй систему как:

> **Logistics Marketplace + Transport Management + Real-Time Visibility + Trust Network + Integration Platform**

а не просто как:

> "сайт с грузами и машинами".

Главный бизнес-поток:

```text
                 ┌──────────────┐
                 │  SHIPPER     │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │     LOAD     │
                 └──────┬───────┘
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
       PUBLIC MARKET         PRIVATE MARKET
              │                    │
              └─────────┬──────────┘
                        ▼
                  MATCHING /
                  NEGOTIATION
                        │
                        ▼
                  TRANSPORT
                    ORDER
                        │
                        ▼
             VEHICLE + DRIVER
                        │
                        ▼
                EXECUTION
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
          GPS TRACKING       DOCUMENTS
              │                   │
              └─────────┬─────────┘
                        ▼
                    DELIVERY
                        │
                        ▼
                    SETTLEMENT
                        │
                        ▼
              RATING / REPUTATION
                        │
                        ▼
                 TRUST NETWORK
```

Все остальные подсистемы должны быть связаны с этим основным бизнес-циклом.

При наличии неопределённости сначала явно зафиксируй assumption и предложи варианты. Не выдумывай требования, которых нет в постановке.

Документация должна быть на русском языке.
Документация должна открываться в github, все схемы преобразуются в svg, см. файл .gihub/workflows/generate-diagrams.yml