# Промпт 08 — Модель развёртывания, Архитектура данных, Интеграционная архитектура и Безопасность

> **Файлы на выходе:**
>
> - `docs/03-architecture/deployment-model.md`
> - `docs/03-architecture/data-architecture.md`
> - `docs/03-architecture/integration-architecture.md`
> - `docs/03-architecture/security-architecture.md`

---

## Контекст

Продолжаем детальное проектирование архитектурного раздела. На этом шаге специфицируем физическое развертывание, стратегию распределения данных по специализированным хранилищам, правила интеграции с внешними системами и модель безопасности.

Язык — **русский**. Диаграммы — **Mermaid / PlantUML**.

---

## Задание 1: создай `docs/03-architecture/deployment-model.md`

### Содержимое документа

1. **Топология развертывания (Kubernetes / Cloud / On-Premise):**
   - Архитектура кластера Kubernetes: Ingress Controller, Namespaces (dev, staging, prod), Node Pools (General purpose compute, Memory-optimized для Redis/OpenSearch, Storage-optimized для БД/Kafka).
   - Multi-AZ (Availability Zones) отказоустойчивое размещение: распределение по 3 зонам доступности.
2. **Среды окружения (Environments):**
   - Спецификация Development, Staging (зеркало продакшена со срезом обезличенных данных), Production.
3. **CI/CD Pipeline и стратегия релизов:**
   - Сборка Docker-образов, сканирование уязвимостей (Trivy), Helm-чарты / Kustomize.
   - Blue-Green / Rolling updates для бэкенда, Canary-релизы для критических сервисов.
4. **PlantUML / Mermaid диаграмма физического развертывания.**

---

## Задание 2: создай `docs/03-architecture/data-architecture.md`

### Содержимое документа

1. **Polyglot Persistence — матрица хранилищ:**
   Сформируй подробную таблицу для всех типов данных (из §19 master-prompt):

   | Тип данных                         | Выбранное хранилище                      | Почему именно оно (обоснование)                                            | Рассмотренные альтернативы  | Требования к репликации и бэкапу            |
   | ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | --------------------------- | ------------------------------------------- |
   | Orders, Shipments, IAM, Billing    | PostgreSQL (Primary/Replica)             | ACID, строгая консистентность, реляционная модель                          | MySQL, MongoDB              | Streaming replication, WAL-архивирование    |
   | Marketplace Search Index           | OpenSearch                               | Geo-distance queries, полнотекстовый поиск, фасетная фильтрация            | PostgreSQL FTS, Meilisearch | 3 nodes, primary + replica shards           |
   | GPS Live Telemetry (Current State) | Redis (In-Memory Key-Value / Geospatial) | Сверхнизкая задержка (<1ms), GEOADD/GEORADIUS                              | Memcached, Tarantool        | Redis Sentinel / Cluster                    |
   | GPS Track History (TimeSeries)     | TimescaleDB / ClickHouse                 | Эффективное сжатие временных рядов, быстрый диапазонный поиск              | Cassandra, InfluxDB         | Retention policy, chunk compression         |
   | Documents, Photos, Scan PoD        | S3-compatible Object Storage             | Неограниченная емкость, дешевизна, неизменяемость (WORM)                   | Local filesystem, GridFS    | Multi-AZ erasure coding                     |
   | Domain & Integration Events        | Apache Kafka                             | Высокая пропускная способность, replayability, строгий порядок в партициях | RabbitMQ, NATS              | Replication Factor 3, min.insync.replicas 2 |
   | Analytics & Reports                | ClickHouse                               | Колоночное хранение, OLAP-агрегации по миллиардам строк                    | PostgreSQL, BigQuery        | Distributed tables, ежедневная репликация   |

2. **Стратегия кэширования (Multi-layer Caching):**
   - L1: In-process cache (справочники, конфиги).
   - L2: Distributed Redis Cache (сессии, профили организаций, текущие котировки).
   - Инвалидация кэша: Event-driven Cache Eviction (потребители событий сбрасывают соответствующие ключи).
3. **Архитектура потоков данных (Data Pipelines):**
   - Transactional Outbox Pattern → Debezium / Outbox Publisher → Kafka → OpenSearch Indexer / ClickHouse Syncer.

---

## Задание 3: создай `docs/03-architecture/integration-architecture.md`

### Содержимое документа

1. **Интеграционные протоколы и паттерны:**
   - **Синхронный REST API**: для типовых CRUD и интерактивных операций TMS.
   - **Асинхронные Webhooks**: для уведомления внешних TMS о смене статусов заказов, согласовании офферов и поступлении документов.
   - **Event-Driven Integration (Kafka / AMQP bridges)**: для крупных enterprise-партнеров.
2. **Надежная доставка вебхуков (Webhook Reliability Pipeline):**
   - Схема: `Domain Event → Outbox → Kafka → Webhook Dispatcher → HTTP POST клиенту → Retry с Exponential Backoff → Dead Letter Queue (DLQ)`.
   - Защита вебхуков: подпись `X-Signature-SHA256`, timestamp для защиты от replay-атак, валидация SSL-сертификата получателя.
3. **Интеграция с телематическими системами (GPS Adapters):**
   - Протоколы: Wialon IPS, Omnicomm, EGTS, прямые HTTP/JSON пуши от мобильных приложений.
   - Изоляция сетевого периметра через Stateless Ingestion Gateway.

---

## Задание 4: создай `docs/03-architecture/security-architecture.md`

### Содержимое документа

1. **Эшелонированная оборона (Defense in Depth):**
   - Периметр: DDoS-защита (Cloudflare / Qrator), WAF, TLS Termination.
   - Шлюз: API Gateway (Rate Limiting, JWT validation, IP reputation).
   - Сервисный слой: RBAC / ABAC, проверка владения ресурсом (`organization_id == user.org_id`).
   - Слой данных: шифрование дисков (LUKS), шифрование секретов в БД, хранение паролей (Argon2id).
2. **Аутентификация и управление токенами:**
   - OAuth 2.0 / OIDC: Access Token (короткоживущий JWT ~15 мин) + Refresh Token (хранится в Redis с ротацией).
   - API Keys для внешних интеграций: хеширование sha256 в БД, префиксы (`carg_live_...`), мгновенный отзыв.
3. **Изоляция тенантов (Multi-tenant Security):**
   - Row-Level Security / Application-level tenant filter.
   - Защита от BOLA/IDOR уязвимостей.
