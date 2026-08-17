# Распределенный трейсинг (Distributed Tracing)

## 1. Стандарт OpenTelemetry (OTel)
- В системе применяется стандарт сквозной трассировки через W3C Trace Context заголовки (`traceparent`, `tracestate`).
- Распространение контекста трейсинга осуществляется через HTTP (в заголовках `Headers`), gRPC (метаданные), а также Kafka (внутри record headers).

## 2. Эталонный сквозной трейс (End-to-End Trace Example)
На примере создания груза:
- **Шаг 1:** `Client POST /api/v1/loads` -> Span: `api_gateway.handle`
- **Шаг 2:** `LoadService.create_load` -> Span: `load_service.create`
- **Шаг 3:** `PostgreSQL INSERT loads` -> Span: `db.insert_load`
- **Шаг 4:** `OutboxWorker.publish` -> Span: `outbox.poll_and_publish`
- **Шаг 5:** `Kafka Producer topic: marketplace.loads` -> Span: `kafka.produce`
- **Шаг 6:** `OpenSearch Indexer Consumer` -> Span: `indexer.consume_and_index`
- **Шаг 7:** `Notification Worker` -> Span: `notification.send_matches`
