# Ограниченные контексты (Bounded Contexts)

В данном документе приведено детальное описание 12 ограниченных контекстов (Bounded Contexts) логистической платформы.

## 1. Identity & Access Management (IAM)

- **Назначение и бизнес-ответственность**: Управление пользователями, организациями (компаниями), ролями, правами доступа и процессом аутентификации. Является ядром мульти-тенантности.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `User`, `Company` (Tenant), `Role`, `Permission`, `Session`.
  - **Read Models**: -
  - **Не модифицирует**: Данные бизнес-процессов (заказы, грузы и т.д.).
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /auth/login`, `POST /auth/register`
  - `GET /companies/{id}`, `PUT /users/{id}/roles`
- **Публикуемые события (Published Domain Events)**:
  - `CompanyRegistered`, `UserCreated`, `UserBanned`, `RoleChanged`.
- **Потребляемые события (Consumed Domain Events)**: - (в основном автономен).
- **Требования к консистентности (Consistency Requirements)**:
  - Strong Consistency внутри управления правами.
  - Eventual Consistency для обновления данных профиля в других контекстах.
- **Характер нагрузки (Workload Profile)**: Высокий Read (валидация токенов, проверка прав), низкий/средний Write.
- **Хранилище данных (Storage Strategy)**: Отдельная БД Postgres. Обоснование: реляционная модель хорошо подходит для сложных связей ролей и пользователей.
- **Deployment Unit (MVP vs Evolution)**: В MVP — отдельный сервис (например, на базе Keycloak) или четко изолированный модуль (в случае самописного монолита), так как это фундаментальная часть архитектуры.

## 2. Marketplace (Loads & Trucks Board)

- **Назначение и бизнес-ответственность**: Публикация грузов и свободного транспорта. Быстрый поиск, фильтрация, фасетный поиск. (В отличие от Execution, здесь сущности живут до момента договоренности).
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `LoadPost` (публикация груза), `TruckPost` (публикация машины).
  - **Read Models**: `CompanyProfile` (из IAM), `TrustRating` (из Trust).
  - **Не модифицирует**: Заказы (Transport Execution), Рейтинги.
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /loads`, `GET /loads/search`, `POST /trucks`
- **Публикуемые события (Published Domain Events)**:
  - `LoadPublished`, `LoadArchived`, `TruckPublished`.
- **Потребляемые события (Consumed Domain Events)**:
  - `DealConcluded` (от Matching) — чтобы снять груз с доски.
  - `CompanyBanned` (от IAM/Trust) — чтобы скрыть грузы нарушителя.
- **Требования к консистентности (Consistency Requirements)**:
  - Eventual Consistency между добавлением груза и его появлением в поиске (индексация).
- **Характер нагрузки (Workload Profile)**: Пиковый Read (очень частые запросы поиска/фильтрации), высокий Write.
- **Хранилище данных (Storage Strategy)**: Elasticsearch/OpenSearch для поиска + Postgres как Primary Storage.
- **Deployment Unit (MVP vs Evolution)**: Отдельный модуль (в MVP) или микросервис, который легко скейлится по чтению.

## 3. Matching & Negotiation Engine

- **Назначение и бизнес-ответственность**: Умный матчинг грузов и машин (рекомендации), проведение торгов, аукционов на понижение/повышение, встречные предложения (офферы).
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `Bid`, `Offer`, `Auction`, `MatchResult`.
  - **Read Models**: `LoadPost`, `TruckPost`.
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /bids`, `PUT /offers/{id}/accept`, `GET /matches/recommendations`
- **Публикуемые события (Published Domain Events)**:
  - `BidPlaced`, `OfferAccepted`, `DealConcluded`.
- **Потребляемые события (Consumed Domain Events)**:
  - `LoadPublished`, `TruckPublished` — для запуска алгоритма матчинга.
- **Требования к консистентности (Consistency Requirements)**:
  - Strong Consistency при ставках (чтобы не было Race Condition при одновременном принятии оффера).
- **Характер нагрузки (Workload Profile)**: Вычислительно интенсивный (матчинг), частые транзакции (торги).
- **Хранилище данных (Storage Strategy)**: Postgres для транзакций торгов, Redis для быстрого доступа к активным аукционам.
- **Deployment Unit (MVP vs Evolution)**: На этапе MVP может быть совмещен с Marketplace, при росте выделяется в микросервис из-за ресурсоемкости.

## 4. Transport Order & Execution (TMS)

- **Назначение и бизнес-ответственность**: Управление конкретным заказом на перевозку (после того, как стороны договорились на Маркетплейсе). Статусная модель заказа, назначение водителей/ТС, фиксация инцидентов.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `TransportOrder`, `OrderStatusHistory`, `Incident`.
  - **Read Models**: `DriverInfo`, `TruckInfo`, `CompanyInfo`.
  - **Не модифицирует**: Финансы, GPS-координаты, сущности Маркетплейса.
- **Предоставляемые API (Inbound Interfaces)**:
  - `GET /orders/{id}`, `PUT /orders/{id}/status`, `POST /orders/{id}/assign-driver`
- **Публикуемые события (Published Domain Events)**:
  - `OrderCreated`, `OrderStatusChanged`, `OrderCompleted`, `IncidentReported`.
- **Потребляемые события (Consumed Domain Events)**:
  - `DealConcluded` — триггер создания заказа.
  - `GeofenceCrossed` — для автоматической смены статуса (прибыл/убыл).
- **Требования к консистентности (Consistency Requirements)**:
  - Strong Consistency при переходе по стейт-машине заказа (нельзя перепрыгнуть статусы, важна строгая транзакционность).
- **Характер нагрузки (Workload Profile)**: Сбалансированный Read/Write. Умеренный RPS, но сложные бизнес-правила.
- **Хранилище данных (Storage Strategy)**: Postgres (надежное реляционное хранение).
- **Deployment Unit (MVP vs Evolution)**: Ядро системы, отдельный модуль монолита или микросервис.

## 5. Fleet & Driver Management

- **Назначение и бизнес-ответственность**: Управление автопарком компании (тягачи, прицепы), профили водителей, документы на ТС и права. Не выделяется в микросервис ради CRUD, но это отдельный логический контекст.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `Vehicle`, `Driver`, `VehicleDocument`.
  - **Read Models**: -
  - **Не модифицирует**: Заказы, Грузы.
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /fleet/vehicles`, `GET /fleet/drivers`, `PUT /fleet/vehicles/{id}/status`
- **Публикуемые события (Published Domain Events)**:
  - `VehicleRegistered`, `DriverUpdated`, `VehicleStatusChanged`.
- **Потребляемые события (Consumed Domain Events)**: -
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency для обновления кэшей в TMS/Marketplace.
- **Характер нагрузки (Workload Profile)**: Низкий RPS (справочные данные), преобладает Read.
- **Хранилище данных (Storage Strategy)**: Postgres.
- **Deployment Unit (MVP vs Evolution)**: Модуль в монолите (в MVP не требует выделения в отдельный сервис).

## 6. Location & GPS Tracking

- **Назначение и бизнес-ответственность**: Сбор телеметрии с мобильного приложения или GPS-трекеров, расчет ETA (время прибытия), контроль геозон (Geofencing).
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `LocationPoint`, `GeofenceEvent`, `RouteHistory`.
  - **Read Models**: `TransportOrder` (ожидаемые точки маршрута).
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /tracking/telemetry`, `GET /tracking/orders/{id}/current-location`
- **Публикуемые события (Published Domain Events)**:
  - `GeofenceCrossed`, `LocationUpdated` (с пониженной частотой), `ETADelayed`.
- **Потребляемые события (Consumed Domain Events)**:
  - `OrderCreated`, `OrderCompleted` — для старта/остановки отслеживания.
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency (потеря одной точки телеметрии не критична).
- **Характер нагрузки (Workload Profile)**: Очень высокий Write (поток телеметрии), аналитический Read.
- **Хранилище данных (Storage Strategy)**: TimescaleDB или ClickHouse для временных рядов (Time-series).
- **Deployment Unit (MVP vs Evolution)**: Сразу отдельный сервис (очень специфичный профиль нагрузки и хранилище).

## 7. Document Management & E-Signature (EDO)

- **Назначение и бизнес-ответственность**: Генерация PDF-документов (договоры, заявки, УПД, ТрН), управление их жизненным циклом, интеграция с провайдерами ЭЦП.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `Document`, `DocumentTemplate`, `Signature`.
  - **Read Models**: Данные из других контекстов для заполнения шаблонов.
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /docs/generate`, `POST /docs/{id}/sign`, `GET /docs/{id}/download`
- **Публикуемые события (Published Domain Events)**:
  - `DocumentGenerated`, `DocumentSigned`, `DocumentRejected`.
- **Потребляемые события (Consumed Domain Events)**:
  - `OrderStatusChanged` — триггер на генерацию ТрН по факту погрузки.
- **Требования к консистентности (Consistency Requirements)**: Strong Consistency при фиксации факта подписания.
- **Характер нагрузки (Workload Profile)**: Ресурсоемкий (генерация PDF), большой объем хранения (Object Storage).
- **Хранилище данных (Storage Strategy)**: Postgres (метаданные), S3-совместимое хранилище (файлы).
- **Deployment Unit (MVP vs Evolution)**: Модуль или отдельный сервис из-за необходимости масштабирования воркеров генерации PDF.

## 8. Billing, Pricing & Settlement (Finance)

- **Назначение и бизнес-ответственность**: Тарификация подписок платформы, биллинг услуг, расчеты между участниками (если платформа выступает агентом), выставление счетов, контроль дебиторки.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `Invoice`, `Transaction`, `Wallet` (или баланс), `Subscription`.
  - **Read Models**: `TransportOrder`, `Company`.
- **Предоставляемые API (Inbound Interfaces)**:
  - `GET /billing/invoices`, `POST /billing/pay`, `GET /billing/balance`
- **Публикуемые события (Published Domain Events)**:
  - `InvoicePaid`, `SubscriptionExpired`, `PaymentFailed`.
- **Потребляемые события (Consumed Domain Events)**:
  - `OrderCompleted`, `DocumentSigned` — триггеры для выставления счета.
- **Требования к консистентности (Consistency Requirements)**: Strong Consistency (ACID), недопустима потеря финансовых транзакций.
- **Характер нагрузки (Workload Profile)**: Низкий/средний RPS, высочайшие требования к надежности.
- **Хранилище данных (Storage Strategy)**: Postgres (строгая изоляция транзакций).
- **Deployment Unit (MVP vs Evolution)**: Отдельный изолированный модуль/сервис (из соображений безопасности и надежности).

## 9. Trust, Verification & Reputation

- **Назначение и бизнес-ответственность**: Система отзывов, рейтингов, скоринг надежности (на основе истории), проверка документов (KYC/KYB), управление банами.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `Review`, `Rating`, `VerificationRequest`.
  - **Read Models**: `Company`, `TransportOrder` (история).
- **Предоставляемые API (Inbound Interfaces)**:
  - `POST /reviews`, `GET /ratings/{companyId}`, `POST /verification/submit`
- **Публикуемые события (Published Domain Events)**:
  - `RatingChanged`, `CompanyVerified`, `VerificationFailed`.
- **Потребляемые события (Consumed Domain Events)**:
  - `OrderCompleted` — триггер возможности оставить отзыв.
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency для пересчета рейтинга.
- **Характер нагрузки (Workload Profile)**: Средний, периодический тяжелый пересчет скоринга (Batch processing).
- **Хранилище данных (Storage Strategy)**: Postgres / MongoDB (если много неструктурированных данных проверок).
- **Deployment Unit (MVP vs Evolution)**: Модуль в монолите.

## 10. Communication & Collaboration (Messenger)

- **Назначение и бизнес-ответственность**: Чаты между участниками платформы, привязанные к контексту (торги, заказ), обмен файлами в реальном времени.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `ChatRoom`, `Message`, `Attachment`.
  - **Read Models**: -
- **Предоставляемые API (Inbound Interfaces)**:
  - WebSockets / gRPC streams для реалтайм обмена, `GET /chats/{id}/history`
- **Публикуемые события (Published Domain Events)**:
  - `MessageSent` (обычно внутренние, наружу в Notification Gateway для оффлайн пользователей).
- **Потребляемые события (Consumed Domain Events)**:
  - `DealConcluded`, `OrderCreated` — для автоматического создания чат-комнаты.
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency (доставка сообщений в реальном времени).
- **Характер нагрузки (Workload Profile)**: Высокий RPS (постоянные соединения, частые мелкие пакеты).
- **Хранилище данных (Storage Strategy)**: Cassandra или специализированная БД для чатов / Postgres + Redis (Pub/Sub).
- **Deployment Unit (MVP vs Evolution)**: Сразу отдельный сервис (требует управления WebSocket подключениями).

## 11. Integration Platform (External TMS/ERP/WMS)

- **Назначение и бизнес-ответственность**: Шлюз (Anti-Corruption Layer) для интеграции с 1С, SAP и другими системами. Обработка входящих webhook-ов и выгрузка данных по API клиентов.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: `IntegrationMapping`, `ApiLog`, `WebhookConfig`.
  - **Не владеет бизнес-сущностями**.
- **Предоставляемые API (Inbound Interfaces)**:
  - Стандартизированный публичный API (B2B), `POST /integration/webhooks`
- **Публикуемые события (Published Domain Events)**:
  - Транслирует внешние события во внутренние доменные события.
- **Потребляемые события (Consumed Domain Events)**:
  - Потребляет все публичные события для отправки Webhooks клиентам.
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency (надежная доставка с retry-политиками).
- **Характер нагрузки (Workload Profile)**: Зависит от активности интеграций, могут быть спайки.
- **Хранилище данных (Storage Strategy)**: Postgres (настройки) + RabbitMQ/Kafka (очереди для надежной доставки).
- **Deployment Unit (MVP vs Evolution)**: Отдельный сервис шлюза.

## 12. Analytics, Market Insights & Reporting

- **Назначение и бизнес-ответственность**: Анализ рынка, вычисление средних ставок, формирование индексов, BI-отчеты для пользователей платформы.
- **Владение данными (Data Ownership)**:
  - **Source of Truth**: Агрегированные отчеты, Индексы.
  - **Read Models**: Все необходимые данные из других контекстов (через CDC или Event Sourcing).
- **Предоставляемые API (Inbound Interfaces)**:
  - `GET /analytics/market-index`, `GET /reports/performance`
- **Публикуемые события (Published Domain Events)**: -
- **Потребляемые события (Consumed Domain Events)**:
  - Подписка на все основные события системы для пополнения Data Warehouse (DWH).
- **Требования к консистентности (Consistency Requirements)**: Eventual Consistency (данные в DWH могут отставать на минуты/часы).
- **Характер нагрузки (Workload Profile)**: Тяжелые аналитические запросы (OLAP), batch-процессинг.
- **Хранилище данных (Storage Strategy)**: ClickHouse / Greenplum / Snowflake (OLAP хранилище).
- **Deployment Unit (MVP vs Evolution)**: Отдельный контур Data-инженерии.
