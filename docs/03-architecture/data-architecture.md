# Архитектура данных

## 1. Polyglot Persistence — матрица хранилищ

| Тип данных                         | Выбранное хранилище                      | Почему именно оно (обоснование)                                            | Рассмотренные альтернативы  | Требования к репликации и бэкапу            |
| ---------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | --------------------------- | ------------------------------------------- |
| Orders, Shipments, IAM, Billing    | PostgreSQL (Primary/Replica)             | ACID, строгая консистентность, реляционная модель                          | MySQL, MongoDB              | Streaming replication, WAL-архивирование    |
| Marketplace Search Index           | OpenSearch                               | Geo-distance queries, полнотекстовый поиск, фасетная фильтрация            | PostgreSQL FTS, Meilisearch | 3 nodes, primary + replica shards           |
| GPS Live Telemetry (Current State) | Redis (In-Memory Key-Value / Geospatial) | Сверхнизкая задержка (<1ms), GEOADD/GEORADIUS                              | Memcached, Tarantool        | Redis Sentinel / Cluster                    |
| GPS Track History (TimeSeries)     | TimescaleDB / ClickHouse                 | Эффективное сжатие временных рядов, быстрый диапазонный поиск              | Cassandra, InfluxDB         | Retention policy, chunk compression         |
| Documents, Photos, Scan PoD        | S3-compatible Object Storage             | Неограниченная емкость, дешевизна, неизменяемость (WORM)                   | Local filesystem, GridFS    | Multi-AZ erasure coding                     |
| Domain & Integration Events        | Apache Kafka                             | Высокая пропускная способность, replayability, строгий порядок в партициях | RabbitMQ, NATS              | Replication Factor 3, min.insync.replicas 2 |
| Analytics & Reports                | ClickHouse                               | Колоночное хранение, OLAP-агрегации по миллиардам строк                    | PostgreSQL, BigQuery        | Distributed tables, ежедневная репликация   |

## 2. Стратегия кэширования (Multi-layer Caching)

- **L1: In-process cache**: Быстрый локальный кэш внутри инстанса приложения (используется для справочников, конфигураций, редко изменяемых данных).
- **L2: Distributed Redis Cache**: Распределенный кэш (сессии пользователей, профили организаций, текущие рыночные котировки).
- **Инвалидация кэша**: Event-driven Cache Eviction. Потребители доменных событий (консьюмеры) слушают изменения сущностей и целенаправленно сбрасывают или обновляют соответствующие ключи в кэше, предотвращая устаревание данных.

## 3. Архитектура потоков данных (Data Pipelines)

Используется **Transactional Outbox Pattern** для надежной публикации событий, предотвращающий проблему dual write.

- Паттерн: `Transactional Outbox` → `Debezium` (CDC) или `Outbox Publisher` (polling/tailing) → `Kafka`.
- Потребители из Kafka (Sink Connectors или кастомные консьюмеры) направляют данные в поисковые и аналитические хранилища: `OpenSearch Indexer`, `ClickHouse Syncer`.
