# Промпт 09 — Архитектурные представления (4+1 Architectural Views)

> **Файлы на выходе:**
>
> - `docs/03-architecture/views/logical-view.md`
> - `docs/03-architecture/views/runtime-view.md`
> - `docs/03-architecture/views/deployment-view.md`
> - `docs/03-architecture/views/data-flow-view.md`

---

## Контекст

Формируем комплект архитектурных представлений по классической модели **Kruchten 4+1 View Model**.
Это позволяет всесторонне описать сложную логистическую систему для разных заинтересованных лиц (разработчиков, системных администраторов, архитекторов интеграций и безопасности).

Язык — **русский**. Диаграммы — **Mermaid / PlantUML**.

---

## Задание 1: создай `docs/03-architecture/views/logical-view.md`

### Содержимое документа (Логическое представление)

1. Декомпозиция системы на пакеты, модули и уровни абстракции (Layered Architecture):
   - **Interface Layer**: API Controllers, Webhook Handlers, WebSocket Gateways, CLI.
   - **Application Layer**: Use Case Handlers, Command/Query Handlers (CQRS), Saga Coordinators.
   - **Domain Layer**: Aggregates, Entities, Value Objects, Domain Services, Domain Events, Repositories Interfaces.
   - **Infrastructure Layer**: DB Repositories, Kafka Producers/Consumers, OpenSearch Client, S3 Client, Telematics Decoders.
2. Mermaid-диаграмма зависимостей между модулями и подсистемами.
3. Правила соблюдения чистой архитектуры (Dependency Inversion Principle) и запреты циклических зависимостей.

---

## Задание 2: создай `docs/03-architecture/views/runtime-view.md`

### Содержимое документа (Представление процессов и времени выполнения)

1. Описание параллелизма, потоков выполнения, очередей и межпроцессного взаимодействия.
2. Детальные sequence-диаграммы (Mermaid) для трех ключевых сценариев реального времени:
   - **Сценарий 1: Публикация груза и индексация**
     - Пользователь отправляет `POST /api/v1/loads` → LoadService валидирует и сохраняет в Postgres → Outbox запись → CDC/Outbox Worker читает и пушит в Kafka `load.published` → OpenSearch Indexer читает событие и обновляет поисковый индекс → Notification Worker отправляет уведомления подписчикам сохраненных поисков.
   - **Сценарий 2: Прием и обработка GPS-координаты**
     - Водительское приложение пушит пакет координат → Ingestion Gateway проверяет аутентификацию и пишет в Kafka `telemetry.raw` → Telemetry Processor считывает, фильтрует выбросы, проверяет геозоны погрузки/разгрузки → сохраняет в Redis текущую позицию и в TimescaleDB историю → транслирует через WebSocket диспетчеру на карту.
   - **Сценарий 3: Мгновенное заключение сделки (Offer Acceptance & Order Creation)**
     - Грузовладелец акцептует встречный оффер → атомарная транзакция в Postgres (блокировка груза, закрытие офферов-конкурентов, создание Transport Order) → публикация `order.created` → запуск саги резервирования транспорта.

---

## Задание 3: создай `docs/03-architecture/views/deployment-view.md`

### Содержимое документа (Физическое представление развертывания)

1. Маппинг программных артефактов (Docker контейнеров, бинарников) на физические/виртуальные узлы и поды Kubernetes.
2. Сетевая топология:
   - DMZ / Public Subnet (Ingress, WAF, Load Balancers).
   - Application Private Subnet (Backend Services, Ingestion Workers).
   - Data Private Subnet (PostgreSQL StatefulSets, OpenSearch Cluster, Kafka Brokers, Redis Cluster, MinIO).
3. Требования к ресурсам (CPU, RAM, Storage, Network Bandwidth) для каждого узла.

---

## Задание 4: создай `docs/03-architecture/views/data-flow-view.md`

### Содержимое документа (Представление потоков данных)

1. Детальная Mermaid-схема движения данных по всей платформе:
   - **Транзакционный поток (OLTP Flow)**: REST API → Application Services → PostgreSQL.
   - **Поисковый поток (Search/Read Model Flow)**: PostgreSQL (Outbox) → Kafka → OpenSearch → Search API Consumers.
   - **Телематический поток (IoT/Telematics Flow)**: GPS Trackers → Gateway → Kafka → Stream Processor → Redis (Hot) + TimescaleDB (Warm) + S3 (Cold Archive).
   - **Аналитический поток (OLAP Flow)**: Kafka Events + Postgres CDC → ClickHouse → BI Dashboards / Rate Index.
2. Анализ задержек данных (Data Latency SLAs) на каждом этапе потоков.
