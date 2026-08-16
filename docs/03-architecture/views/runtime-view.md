# Представление процессов и времени выполнения (Runtime View)

В данном разделе описывается динамическое поведение системы: параллелизм, потоки выполнения, очереди и межпроцессное взаимодействие, а также сценарии обработки данных в реальном времени.

## 1. Параллелизм и межпроцессное взаимодействие

Платформа спроектирована для высоких нагрузок и асинхронной обработки:

- **Синхронные потоки (REST/gRPC)**: Обработка HTTP-запросов пользователей и API-клиентов. Ограничены тайм-аутами, служат для быстрого ответа клиенту (OLTP).
- **Асинхронные потоки (Message Brokers)**: Использование Apache Kafka для передачи событий между микросервисами. Обеспечивает слабую связность и гарантированную доставку (At-Least-Once).
- **Фоновые воркеры (Workers/Cron)**: Процессы, вычитывающие данные из Kafka или выполняющие задачи по расписанию (очистка, генерация отчетов).
- **Паттерн Transactional Outbox**: Гарантирует атомарность сохранения в БД (PostgreSQL) и отправки события в Kafka через механизм CDC (Change Data Capture) или Outbox Poller.

## 2. Ключевые сценарии реального времени

### Сценарий 1: Публикация груза и индексация

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LoadService as API (Load Service)
    participant Postgres
    participant OutboxWorker as CDC / Outbox
    participant Kafka
    participant OpenSearchWorker as Search Indexer
    participant OpenSearch
    participant NotificationWorker as Notifier

    User->>LoadService: POST /api/v1/loads
    activate LoadService
    LoadService->>Postgres: BEGIN Transaction
    LoadService->>Postgres: INSERT INTO loads
    LoadService->>Postgres: INSERT INTO outbox (event: load.published)
    LoadService->>Postgres: COMMIT
    LoadService-->>User: 201 Created
    deactivate LoadService

    OutboxWorker->>Postgres: Poll / CDC stream
    OutboxWorker->>Kafka: Publish "load.published"

    par Indexing
        Kafka-->>OpenSearchWorker: Consume event
        OpenSearchWorker->>OpenSearch: Update/Insert document
    and Notifications
        Kafka-->>NotificationWorker: Consume event
        NotificationWorker->>NotificationWorker: Check saved searches
        NotificationWorker->>User: Send Push/Email
    end
```

### Сценарий 2: Прием и обработка GPS-координаты

```mermaid
sequenceDiagram
    autonumber
    participant DriverApp as Driver App
    participant Gateway as Ingestion Gateway
    participant KafkaRaw as Kafka (telemetry.raw)
    participant Processor as Telemetry Processor
    participant Redis as Redis (Hot Position)
    participant Timescale as TimescaleDB (History)
    participant WSGateway as WebSocket Gateway
    actor Dispatcher as Dispatcher (Web)

    DriverApp->>Gateway: Push GPS points (HTTP/MQTT)
    Gateway->>Gateway: Auth & Validate
    Gateway->>KafkaRaw: Publish to telemetry.raw
    Gateway-->>DriverApp: 202 Accepted

    KafkaRaw-->>Processor: Consume batch
    Processor->>Processor: Filter outliers, check geofences

    par Update Cache
        Processor->>Redis: SET driver_id:position
    and Save History
        Processor->>Timescale: INSERT INTO gps_history
    and Broadcast
        Processor->>KafkaRaw: Publish telemetry.processed (optional)
        Processor->>WSGateway: Forward to active channels
        WSGateway-->>Dispatcher: WebSocket frame (new position)
    end
```

### Сценарий 3: Мгновенное заключение сделки (Offer Acceptance)

```mermaid
sequenceDiagram
    autonumber
    actor Shipper as Грузовладелец
    participant API as Offer Service
    participant Postgres
    participant Kafka
    participant SagaCoordinator as Order Saga

    Shipper->>API: POST /offers/{id}/accept
    activate API
    API->>Postgres: BEGIN
    API->>Postgres: UPDATE load SET status='locked'
    API->>Postgres: UPDATE offers SET status='rejected' WHERE id != {id}
    API->>Postgres: INSERT INTO transport_orders
    API->>Postgres: INSERT INTO outbox (event: order.created)
    API->>Postgres: COMMIT
    API-->>Shipper: 200 OK
    deactivate API

    Postgres-->>Kafka: Outbox CDC (order.created)
    Kafka-->>SagaCoordinator: Trigger Saga
    SagaCoordinator->>SagaCoordinator: Start vehicle reservation...
```
