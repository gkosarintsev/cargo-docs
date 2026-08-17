# Каталог метрик системы

## 1. Системные метрики (RED и USE методы)
- **HTTP**: `http_requests_total` (counter), `http_request_duration_seconds` (histogram p50, p90, p99), `http_requests_errors_total` (counter).
- **Kafka**: `kafka_consumer_lag_records` (gauge), `kafka_producer_throughput_bytes` (rate).
- **Базы Данных**: `pg_stat_activity_connections` (gauge), `pg_stat_database_deadlocks` (counter), `redis_connected_clients` (gauge), `redis_used_memory_bytes` (gauge).

## 2. Бизнес-метрики платформы
- `loads_published_total` (counter по labels: `region`, `body_type`)
- `loads_search_requests_total` (counter) & `loads_search_duration_seconds` (histogram)
- `offers_submitted_total` (counter) & `offers_accepted_total` (counter)
- `orders_created_total`, `orders_active_gauge`, `orders_completed_total`, `orders_cancelled_total`
- `gps_positions_received_total` (counter), `gps_positions_dropped_total` (counter), `gps_ingestion_delay_seconds` (histogram)
- `documents_uploaded_total` (counter), `pod_processing_duration_seconds` (histogram)
