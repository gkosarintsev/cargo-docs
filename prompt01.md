# Промпт 01 — Структура docs/, README и глоссарий

> **Файлы на выходе:**
>
> - `docs/README.md`
> - `docs/glossary/glossary.md`

---

## Контекст

Ты проектируешь техническую документацию для **современной цифровой логистической платформы** — маркетплейса грузоперевозок, аналогичного ATI.SU, Trans.eu, TIMOCOM, DAT Freight & Analytics.

Платформа объединяет:

- грузовладельцев (shippers)
- экспедиторов (freight forwarders)
- перевозчиков (carriers)
- транспортные компании
- автопарки, водителей, диспетчеров
- администраторов платформы
- внешние системы (TMS/ERP/WMS)

Основной бизнес-поток:

```
Shipper → Load → Marketplace (Public / Private) → Matching / Negotiation →
Transport Order → Vehicle + Driver → Execution → GPS Tracking + Documents →
Delivery → Settlement → Rating / Reputation → Trust Network
```

Обратный сценарий: Carrier публикует свободную машину → Shipper находит и бронирует.

Документация пишется **на русском языке**, должна открываться на GitHub, все диаграммы — diagrams-as-code (Mermaid, PlantUML).

---

## Задание 1: создай `docs/README.md`

Создай файл `docs/README.md` со следующим содержимым:

### 1. Заголовок и описание продукта

- Название: «Техническая документация логистической платформы»
- Краткое описание: цифровой маркетплейс грузоперевозок, объединяющий грузовладельцев, экспедиторов, перевозчиков и их инфраструктуру
- Позиционирование: **Logistics Marketplace + Transport Management + Real-Time Visibility + Trust Network + Integration Platform** (а не просто «сайт с грузами и машинами»)

### 2. Схема основного бизнес-потока

Включи Mermaid-диаграмму основного бизнес-цикла:

```
SHIPPER → LOAD → PUBLIC/PRIVATE MARKET → MATCHING/NEGOTIATION →
TRANSPORT ORDER → VEHICLE+DRIVER → EXECUTION →
GPS TRACKING + DOCUMENTS → DELIVERY → SETTLEMENT →
RATING/REPUTATION → TRUST NETWORK
```

### 3. Навигационное дерево docs/

Полное дерево всех 21 раздела с ссылками:

```
docs/
├── README.md
├── glossary/
├── 01-product-and-domain/
│   ├── product-overview.md
│   ├── actors-and-roles.md
│   ├── business-capabilities.md
│   ├── business-model.md
│   ├── domain-map.md
│   └── bounded-contexts.md
├── 02-requirements/
│   ├── functional-requirements.md
│   ├── non-functional-requirements.md
│   ├── scalability.md
│   ├── availability.md
│   ├── security.md
│   ├── observability.md
│   ├── compliance.md
│   └── disaster-recovery.md
├── 03-architecture/
│   ├── architecture-overview.md
│   ├── principles.md
│   ├── system-context.md
│   ├── deployment-model.md
│   ├── data-architecture.md
│   ├── integration-architecture.md
│   ├── security-architecture.md
│   ├── c4/
│   ├── adr/
│   └── views/
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
├── 05-business-processes/
│   ├── use-cases/
│   ├── workflows/
│   └── exception-flows/
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
├── 08-companies-and-trust/
│   ├── company-profile.md
│   ├── verification.md
│   ├── ratings.md
│   ├── reputation.md
│   ├── risk-scoring.md
│   ├── payment-history.md
│   └── permissions.md
├── 09-fleet/
│   ├── vehicles.md
│   ├── trailers.md
│   ├── drivers.md
│   ├── fleets.md
│   ├── availability.md
│   └── vehicle-driver-assignment.md
├── 10-location-and-routing/
│   ├── addresses.md
│   ├── geocoding.md
│   ├── routing.md
│   ├── distance-calculation.md
│   ├── geo-indexing.md
│   ├── gps-ingestion.md
│   └── tracking.md
├── 11-documents/
│   ├── document-management.md
│   ├── e-documents.md
│   ├── document-types.md
│   ├── signatures.md
│   ├── document-lifecycle.md
│   └── retention.md
├── 12-finance/
│   ├── pricing.md
│   ├── freight-rates.md
│   ├── commissions.md
│   ├── invoices.md
│   ├── payments.md
│   ├── guarantees.md
│   ├── factoring.md
│   └── financial-events.md
├── 13-communication/
│   ├── messenger.md
│   ├── notifications.md
│   ├── email.md
│   ├── sms.md
│   ├── push.md
│   └── realtime.md
├── 14-api/
│   ├── api-guidelines.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── versioning.md
│   ├── idempotency.md
│   ├── pagination.md
│   ├── errors.md
│   ├── rate-limits.md
│   ├── openapi/
│   ├── asyncapi/
│   └── proto/
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
├── 18-observability/
│   ├── logging.md
│   ├── metrics.md
│   ├── tracing.md
│   ├── alerts.md
│   ├── dashboards.md
│   └── slo.md
├── 19-operations/
│   ├── deployment.md
│   ├── environments.md
│   ├── ci-cd.md
│   ├── backups.md
│   ├── disaster-recovery.md
│   ├── runbooks/
│   └── incident-management.md
├── 20-ui/
│   ├── user-flows/
│   ├── screen-contracts/
│   ├── permissions/
│   └── realtime-ui.md
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

### 4. Для кого эта документация

Аудитория: архитекторы, бэкенд/фронтенд-разработчики, бизнес-аналитики, DevOps/SRE, QA-инженеры.

### 5. Принципы документации

- Язык — русский
- Diagrams-as-code (Mermaid, PlantUML, BPMN 2.0)
- Все диаграммы конвертируются в SVG через GitHub Actions (`.github/workflows/generate-diagrams.yml`)
- Итеративная разработка
- Каждое архитектурное решение обосновано (ADR)

### 6. Быстрые ссылки

Ссылки на ключевые точки входа:

- Обзор продукта → `01-product-and-domain/product-overview.md`
- Bounded Contexts → `01-product-and-domain/bounded-contexts.md`
- Архитектура → `03-architecture/architecture-overview.md`
- Domain Model → `04-domain/domain-model.md`
- API → `14-api/api-guidelines.md`
- ADR → `03-architecture/adr/`

---

## Задание 2: создай `docs/glossary/glossary.md`

Создай файл `docs/glossary/glossary.md` — глоссарий предметной области.

### Структура

Организуй глоссарий по тематическим группам, внутри каждой — алфавитно.

### Обязательные группы и термины

#### Участники рынка

- **Shipper / Грузовладелец** — …
- **Carrier / Перевозчик** — …
- **Freight Forwarder / Экспедитор** — …
- **Transport Company / Транспортная компания** — …
- **Fleet Manager / Управляющий автопарком** — …
- **Dispatcher / Диспетчер** — …
- **Driver / Водитель** — …
- **Platform Admin / Администратор платформы** — …

#### Грузы и маркетплейс

- **Load / Груз** — объявление о потребности в перевозке; НЕ заказ, НЕ отправка
- **Truck Offer / Предложение транспорта** — объявление о свободном транспортном средстве
- **Freight Offer / Ценовое предложение** — предложение перевозчика на конкретный груз с ценой
- **Counter Offer / Встречное предложение** — …
- **Negotiation / Переговоры** — …
- **Bid / Заявка на тендер** — …
- **Tender / Тендер** — …
- **Public Marketplace** — открытая площадка, видна всем верифицированным участникам
- **Private Marketplace** — закрытая площадка для определённой группы перевозчиков
- **Matching** — автоматический подбор перевозчика/транспорта для груза
- **Ranking** — ранжирование результатов поиска/matching

#### Транспортный заказ и перевозка

- **Transport Order / Транспортный заказ** — юридически обязывающее соглашение о перевозке (НЕ Load, НЕ Shipment)
- **Shipment / Отправка** — физическая единица выполнения перевозки (1 Order → N Shipments)
- **Cargo / Груз (физический)** — описание перевозимого товара
- **Cargo Item / Грузовое место** — отдельная единица груза
- **Route / Маршрут** — путь перевозки
- **Leg / Плечо маршрута** — отрезок маршрута
- **Stop / Точка маршрута** — адрес погрузки/разгрузки/промежуточной остановки (1 Shipment → N Stops)
- **Proof of Delivery (PoD)** — подтверждение доставки
- **Settlement / Взаиморасчёт** — финансовое закрытие перевозки

#### Транспорт и водители

- **Vehicle / Транспортное средство** — …
- **Trailer / Прицеп** — …
- **Fleet / Автопарк** — группа транспортных средств одной организации
- **Driver Assignment / Назначение водителя** — …
- **Vehicle Availability / Доступность транспорта** — …

#### Организации и доверие

- **Organization / Организация** — юридическое лицо на платформе
- **Department / Подразделение** — …
- **Company Verification / Верификация компании** — …
- **Rating / Рейтинг** — оценка по результатам перевозок
- **Reputation Score** — агрегированный показатель надёжности
- **Risk Score / Оценка риска** — …
- **Payment History / Платёжная история** — …

#### Трекинг и геолокация

- **GPS Device / GPS-устройство** — …
- **Tracking Session / Сессия трекинга** — …
- **Position / Позиция** — координаты в момент времени
- **Geofence / Геозона** — …
- **Route Progress / Прогресс по маршруту** — …
- **ETA / Estimated Time of Arrival** — …

#### Документы

- **CMR** — международная товарно-транспортная накладная
- **eCMR** — электронная CMR
- **Waybill / Путевой лист** — …
- **Document Package / Пакет документов** — …
- **Electronic Signature / Электронная подпись** — …

#### Финансы

- **Quote / Котировка** — предварительная стоимость перевозки
- **Agreement / Соглашение** — зафиксированные коммерческие условия
- **Invoice / Счёт** — …
- **Commission / Комиссия платформы** — …
- **Factoring / Факторинг** — …
- **Escrow** — механизм условного депонирования средств
- **Reconciliation / Сверка** — …
- **Freight Rate Index / Индекс фрахтовых ставок** — …

#### Коммуникация

- **Conversation / Беседа** — переписка, привязанная к Load/Offer/Order
- **Notification / Уведомление** — …
- **In-App Notification** — …
- **WebSocket** — …

#### Архитектурные и технические термины

- **Bounded Context** — ограниченный контекст (DDD), автономная область ответственности
- **Aggregate Root** — корень агрегата, точка входа для транзакционных изменений
- **Domain Event** — событие внутри bounded context (не покидает его границы напрямую)
- **Integration Event** — событие для межсервисной коммуникации (публикуется наружу)
- **Saga** — координация распределённых транзакций через серию локальных транзакций и компенсаций
- **Transactional Outbox** — паттерн: запись события в outbox-таблицу в одной транзакции с бизнес-данными
- **Idempotency Key** — ключ идемпотентности для повторных запросов
- **Optimistic Locking** — оптимистичная блокировка через версионирование
- **CQRS** — разделение моделей чтения и записи
- **Event Sourcing** — хранение состояния как последовательности событий
- **ADR (Architecture Decision Record)** — запись архитектурного решения

### Для каждого термина

- Определение на русском
- Оригинальный термин на английском (если применимо)
- Контекст использования в платформе
- Важные различия с похожими терминами (особенно: Load ≠ Shipment ≠ Order, Domain Event ≠ Integration Event)

---

## Важные замечания для выполнения

1. Язык документации — **русский**
2. Диаграммы — **Mermaid** (для GitHub-рендеринга)
3. Ссылки между файлами — относительные markdown-ссылки
4. Не используй HTML-теги в Mermaid-диаграммах
5. В `README.md` каждый пункт дерева docs/ должен быть ссылкой на соответствующий файл
