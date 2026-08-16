# Промпт 36 — Наблюдаемость: Логирование, Метрики, Трейсинг, Алерты и SLO

> **Файлы на выходе:**
>
> - `docs/18-observability/logging.md`
> - `docs/18-observability/metrics.md`
> - `docs/18-observability/tracing.md`
> - `docs/18-observability/alerts.md`
> - `docs/18-observability/dashboards.md`
> - `docs/18-observability/slo.md`

---

## Контекст

Проектируем раздел **18-observability** (Этап 12).
Формируем единую архитектуру наблюдаемости логистической платформы: структурированное JSON-логирование, метрики бизнес- и системного уровня (Prometheus/Grafana), распределенную трассировку (OpenTelemetry/Tempo), правила алертинга и соглашения об уровне обслуживания (SLI/SLO/SLA) (из §27 master-prompt).

Язык — **русский**.

---

## Задание 1: создай `docs/18-observability/logging.md`

### Содержимое документа (Стандарт структурированного логирования)

1. **Единый JSON-формат лога (Structured JSON Schema)**:
   - Обязательные поля: `timestamp` (ISO-8601 UTC), `level` (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`), `service_name`, `environment`, `trace_id`, `span_id`, `tenant_id`, `user_id`, `message`, `caller` (file/line), `context` (объект с деталями).
2. **Правила фильтрации и безопасности (PII Sanitization)**:
   - Строгий запрет на логирование: паролей, полных номеров банковских карт, секретов API, паспортных данных водителей.
   - Маскирование персональных данных (`phone: "+7 (999) ***-**-12"`).
3. **Пайплайн сбора логов**:
   - `Stdout контейнера → Vector / FluentBit DaemonSet → Grafana Loki / OpenSearch → Grafana UI`.

---

## Задание 2: создай `docs/18-observability/metrics.md`

### Содержимое документа (Каталог метрик системы)

1. **Системные метрики (RED и USE методы)**:
   - `http_requests_total`, `http_request_duration_seconds` (p50, p90, p99 гистограммы), `http_requests_errors_total`.
   - Метрики очередей Kafka: `kafka_consumer_lag_records`, `kafka_producer_throughput_bytes`.
   - Метрики баз данных: `pg_stat_activity_connections`, `pg_stat_database_deadlocks`, `redis_connected_clients`, `redis_used_memory_bytes`.
2. **Бизнес-метрики платформы (из §27 master-prompt)**:
   - `loads_published_total` (counter по регионам и типам кузова).
   - `loads_search_requests_total` & `loads_search_duration_seconds`.
   - `offers_submitted_total` & `offers_accepted_total` (конверсия в сделку).
   - `orders_created_total`, `orders_active_gauge`, `orders_completed_total`, `orders_cancelled_total`.
   - `gps_positions_received_total`, `gps_positions_dropped_total`, `gps_ingestion_delay_seconds`.
   - `documents_uploaded_total`, `pod_processing_duration_seconds`.

---

## Задание 3: создай `docs/18-observability/tracing.md`

### Содержимое документа (Распределенный трейсинг / Distributed Tracing)

1. **Стандарт OpenTelemetry (OTel)**:
   - Сквозная трассировка запросов через W3C Trace Context заголовки (`traceparent`, `tracestate`).
   - Распространение контекста трейсинга через HTTP, gRPC и сообщения Kafka (Headers).
2. **Эталонный сквозной трейс (End-to-End Trace Example)**:
   - Шаг 1: `Client POST /api/v1/loads` (Span: `api_gateway.handle`)
   - Шаг 2: `LoadService.create_load` (Span: `load_service.create`)
   - Шаг 3: `PostgreSQL INSERT loads` (Span: `db.insert_load`)
   - Шаг 4: `OutboxWorker.publish` (Span: `outbox.poll_and_publish`)
   - Шаг 5: `Kafka Producer topic: marketplace.loads` (Span: `kafka.produce`)
   - Шаг 6: `OpenSearch Indexer Consumer` (Span: `indexer.consume_and_index`)
   - Шаг 7: `Notification Worker` (Span: `notification.send_matches`)

---

## Задание 4: создай `docs/18-observability/alerts.md`, `dashboards.md` и `slo.md`

1. **`alerts.md` (Каталог алертов Prometheus Alertmanager)**:
   - Градация критичности:
     - **P1 (Critical / Page duty)**: Падение Primary БД, лаг Kafka > 100k сообщений, недоступность поиска > 1 мин, 5xx ошибки API > 2%.
     - **P2 (Warning)**: Рост задержки API p99 > 1.5s, задержка приема GPS > 30s, рост использования диска > 85%.
     - **P3 (Info)**: Неуспешная доставка одиночного вебхука клиенту.
   - Матрица эскалации и каналы (Opsgenie, Telegram On-call, Email).

2. **`dashboards.md` (Спецификация дашбордов Grafana)**:
   - _Executive Overview_: GMV, количество активных рейсов, DAU, общая доступность.
   - _Marketplace & Search Board_: RPS поиска, конверсия офферов, топ популярных маршрутов.
   - _Telematics & Fleet Health_: входящий поток GPS точек/сек, лаг процессора, статус нод Ingestion Gateway.
   - _Infrastructure Board_: CPU/RAM подов Kubernetes, состояние дисков, репликация PostgreSQL.

3. **`slo.md` (Соглашения об уровне обслуживания SLI / SLO)**:
   - Формальная таблица:

   | Сервис / Операция        | Service Level Indicator (SLI)         | Service Level Objective (SLO) | Error Budget (30 дней)      |
   | ------------------------ | ------------------------------------- | ----------------------------- | --------------------------- |
   | Search API               | % успешных запросов с латенси < 500ms | 99.5%                         | 0.5% (~3.6 часа деградации) |
   | Core Order API           | % успешных ответов (status < 500)     | 99.95%                        | 0.05% (~21 минута простоя)  |
   | GPS Telematics Ingestion | % принятых пакетов без потерь         | 99.99%                        | 0.01% (~4.3 минуты простоя) |
   | Live Dispatcher Map WS   | % времени доступности вебсокетов      | 99.0%                         | 1.0%                        |

---

## Важные замечания для выполнения

- Все метрики и алерты должны содержать конкретные пороги срабатывания (PromQL-выражения).
- Трейсинг должен детально отражать асинхронную природу системы (Outbox + Kafka).
