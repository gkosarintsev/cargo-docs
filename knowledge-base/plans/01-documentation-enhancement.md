# План доработки и расширения технической документации логистической платформы

## 1. Контекст и цели
Документация платформы в `docs/` содержит 21 раздел и более 200 спецификаций. Для достижения статуса исчерпывающей Enterprise-документации уровня Tier-1 закрыты архитектурные пробелы, восполнены отсутствующие контракты, детализированы схемы данных и расширены артефакты Diagrams-as-Code.

---

## 2. Статус реализации плана

### Фаза 1: Устранение критических пробелов и битых ссылок
- [x] `[TASK-001]` **Protobuf Контракты (gRPC)**: Создана директория `docs/14-api/proto/` и спецификации:
  - `telemetry.proto`: High-throughput GPS стриминг с трекеров и телематики.
  - `orders.proto`: Межсервисные RPC для управления статусами транспортных заказов.
  - `matching.proto`: Быстрый расчет совместимости груз-ТС на Go/C++ движке.
  - `README.md`: Каталог и инструкции сборки через protoc/buf.
- [x] `[TASK-002]` **Интеграция верификации (KYC)**: Создан `docs/16-integrations/identity-verification/integration-guide.md` (СПАРК-Интерфакс, ФНС, МВД проверка ВУ, паспортный скоринг, проверка юрлиц).
- [x] `[TASK-003]` **Интеграция внешних бирж**: Создан `docs/16-integrations/external-marketplaces/integration-guide.md` (Синдикация грузов и машин с ATI.SU, Trans.eu, Timocom, адаптеры протоколов, защита от двойного бронирования).

---

### Фаза 2: Схемы данных и физическая архитектура БД (PostgreSQL & PostGIS)
- [x] `[TASK-004]` **Физический DDL & Схемы PostgreSQL**: Расширен `docs/15-data/erd/full-erd.md`:
  - Полный SQL DDL с типами данных, внешними ключами и ограничениями (Check Constraints).
  - Секционирование таблицы телеметрии `telemetry_pings` (по партициям дат через Range Partitioning / Timescale).
  - PostGIS пространственные индексы (`GIST(location)`).
  - Таблицы `outbox_events` (ADR-0011) и `idempotency_keys` (ADR-0012).
  - Политики RLS (Row-Level Security) для мульти-тенантности.
- [x] `[TASK-005]` **Стратегия миграций и версионирования БД**: Дополнен `docs/15-data/migrations.md` правилами Zero-Downtime миграций (Expand/Contract паттерн, lock timeouts, safe column addition, EXCLUDE констрейнты и Lua-скрипты для Redis).

---

### Фаза 3: Событийная модель и AsyncAPI (Event-Driven Architecture)
- [x] `[TASK-006]` **Детализация AsyncAPI контрактов**: Расширен `docs/14-api/asyncapi/events.yaml` точными JSON Schema payload для всех событий:
  - `LoadPublishedEvent`, `OfferSubmittedEvent`, `OrderAssignedEvent`.
  - `GeofenceTransitionEvent`, `TelemetryAlertEvent`.
  - `PoDUploadedEvent`, `InvoiceSettledEvent`.
- [x] `[TASK-007]` **Схемы сериализации**: Описаны стандарты CloudEvents v1.0, W3C Trace Context (`traceparent`) и схемы маршрутизации по топикам Kafka.

---

### Фаза 4: Diagrams-as-Code (PlantUML & C4)
- [x] `[TASK-008]` **PlantUML диаграммы состояний**: Созданы `.puml` файлы в `docs/04-domain/state-machines/` для автоматической генерации SVG через GitHub Actions:
  - `load.puml`
  - `transport-order.puml`
- [x] `[TASK-009]` **C4 Component диаграммы дополнительных сервисов**:
  - `docs/03-architecture/c4/03-components/billing.puml` (Finance, Factoring, Escrow)
  - `docs/03-architecture/c4/03-components/fleet.puml` (Vehicle telematics, Maintenance, Driver compliance)
- [x] `[TASK-010]` **Sequence диаграммы исключительных процессов**:
  - `docs/04-domain/sequence-diagrams/cargo-damage-claim.md` (Акт расхождений / страховой случай)
  - `docs/04-domain/sequence-diagrams/order-cancellation-penalty.md` (Штраф за срыв погрузки)

---

### Фаза 5: Эксплуатация, SRE и Runbooks
- [x] `[TASK-011]` **Runbooks для аварийных ситуаций**: Добавлены в `docs/19-operations/runbooks/`:
  - `gps-telemetry-lag.md` (Отставание потребителей Kafka в топике телеметрии)
  - `redis-cluster-failover.md` (Деградация кэша гео-индекса и сессий)
- [x] `[TASK-012]` **SLO / SLI Метрики**: Расширен `docs/18-observability/slo.md` формулами Prometheus (PromQL), правилами Alertmanager для Multi-Window Multi-Burn-Rate и политикой заморозки релизов (Feature Freeze).

---

### Фаза 6: Интеграция с веб-порталом документации (CargoDocs SPA)
- [x] `[TASK-013]` **Обновление каталога и навигации**: Подключены все созданные proto-контракты (с бейджем gRPC), DDL-схемы, новые интеграционные гайды и аварийные регламенты в веб-интерфейс приложения.
