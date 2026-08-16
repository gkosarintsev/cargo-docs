# Промпт 07 — System Context и C4 Диаграммы (Level 1–3)

> **Файлы на выходе:**
>
> - `docs/03-architecture/system-context.md`
> - `docs/03-architecture/c4/01-system-context.puml`
> - `docs/03-architecture/c4/02-containers.puml`
> - `docs/03-architecture/c4/03-components/marketplace.puml`
> - `docs/03-architecture/c4/03-components/tracking.puml`
> - `docs/03-architecture/c4/03-components/transport.puml`

---

## Контекст

Создаем архитектурные диаграммы по методологии **C4 model** (System Context, Containers, Components).
Все диаграммы должны быть созданы как **Diagrams-as-Code** с использованием **PlantUML C4-PlantUML library** (`!include <C4/C4_Context>`, `!include <C4/C4_Container>`, `!include <C4/C4_Component>`).

Также создаем текстовый документ `system-context.md`, поясняющий внешние границы платформы, протоколы взаимодействия и интеграционные контуры.

Язык — **русский**. Диаграммы должны соответствовать стандартам C4 и корректно компилироваться в SVG через workflow.

---

## Задание 1: создай `docs/03-architecture/system-context.md`

### Содержимое документа

1. Описание границ системы (System Boundary).
2. Описание внешних пользователей:
   - Грузовладельцы / Экспедиторы (Web SPA)
   - Перевозчики / Диспетчеры (Web SPA)
   - Водители (Mobile Android/iOS App)
   - Администраторы и служба поддержки платформы (Web Admin Portal)
3. Описание внешних систем:
   - Внешние TMS / ERP / WMS клиентов (REST / Webhooks)
   - Телематические шлюзы и GPS-трекеры (Wialon, Omnicomm, Galileosky, HTTP/MQTT шлюзы)
   - Картографические и геокодинговые сервисы (OpenStreetMap/OSRM, Yandex Maps, HERE)
   - Платёжные шлюзы и эквайринг (Банковский эквайринг, СБП, Счета/B2B-платежи)
   - Операторы ЭДО / ГИС ЭПД (eCMR, электронные накладные)
   - Сервисы скоринга и проверки контрагентов (ФНС, Контур.Фокус, DaData)
   - Шлюзы коммуникаций (SMS, Push FCM/APNs, Email SMTP/SendGrid)
4. Сводная таблица внешних интеграций: Система | Направление (In/Out) | Протокол | Формат данных | Аутентификация | SLA/Частота.

---

## Задание 2: создай `docs/03-architecture/c4/01-system-context.puml`

### Содержимое файла (PlantUML)

- `C4Context`
- Определение персон (`Person`, `Person_Ext`): Грузовладелец, Перевозчик, Диспетчер, Водитель, Администратор.
- Центральная система (`System`): Цифровая логистическая платформа.
- Внешние системы (`System_Ext`): Внешние TMS/ERP, GPS-провайдеры, Карты/Маршрутизация, Банк/Платежи, Провайдер ЭДО, Провайдер верификации юридических лиц, SMS/Email шлюзы.
- Отношения (`Rel`) с описанием протоколов (HTTPS, REST API, Webhooks, TCP/MQTT).

---

## Задание 3: создай `docs/03-architecture/c4/02-containers.puml`

### Содержимое файла (PlantUML)

- `C4Container`
- Контейнеры интерфейсов:
  - Web SPA (React/Vue/TypeScript)
  - Driver Mobile App (Flutter/React Native/Native)
  - Admin Web Portal
- API Gateway / Reverse Proxy (Traefik/Envoy/Nginx)
- Backend-контейнеры (для целевой Growth/Scale архитектуры):
  - `Core Monolith / API Service` (IAM, Organization, Billing, Document metadata)
  - `Marketplace & Matching Service` (Loads, Trucks, Offers, Tenders)
  - `Search Engine Cluster` (OpenSearch / Elasticsearch)
  - `GPS Ingestion Gateway` (Go/Rust/Netty - высокопроизводительный прием телеметрии)
  - `Tracking & Telematics Processor` (обработка геозон, ETA, стриминг)
  - `Realtime / WebSocket Gateway` (Push координат и статусов диспетчерам)
  - `Notification Worker`
  - `Document Processing & PDF/eCMR Worker`
- Хранилища:
  - `Primary OLTP DB` (PostgreSQL)
  - `Telematics TimeSeries DB` (TimescaleDB / ClickHouse)
  - `In-Memory Cache & Pub/Sub` (Redis)
  - `Message Streaming Bus` (Apache Kafka)
  - `Object Storage` (MinIO / S3)
- Связи между контейнерами с указанием протоколов и портов.

---

## Задание 4: создай C4 Level 3 Component Diagrams

1. **`docs/03-architecture/c4/03-components/marketplace.puml`**:
   - Внутренние компоненты сервиса Marketplace: `LoadController`, `TruckController`, `OfferService`, `MatchingEngine`, `SearchAdapter`, `NegotiationManager`, `OutboxPublisher`, `MarketplaceRepository`.
2. **`docs/03-architecture/c4/03-components/tracking.puml`**:
   - Компоненты подсистемы трекинга: `GpsPacketDecoder`, `TelemetryValidator`, `KafkaProducer`, `GeofenceEvaluator`, `EtaCalculator`, `PositionRedisWriter`, `TimeSeriesHistoryWriter`, `WebSocketBroadcaster`.
3. **`docs/03-architecture/c4/03-components/transport.puml`**:
   - Компоненты Transport Execution: `OrderController`, `ShipmentStateMachine`, `DriverAssigner`, `ExceptionManager`, `PodHandler`, `EventConsumer`, `OrderRepository`.

---

## Важные замечания для выполнения

- Используй официальный синтаксис C4-PlantUML.
- Все подписи связей должны содержать протокол передачи (например: `HTTPS/JSON`, `Kafka Topic: gps.raw`, `gRPC`).
- Код диаграмм должен быть чистым, аккуратно отформатированным и валидным.
