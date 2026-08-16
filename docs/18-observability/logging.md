# Стандарт структурированного логирования

## 1. Единый JSON-формат лога (Structured JSON Schema)
Все сервисы пишут логи исключительно в формате JSON.
Обязательные поля:
- `timestamp`: ISO-8601 UTC (например, "2023-10-25T14:30:00Z")
- `level`: Строгий ENUM (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`)
- `service_name`: Имя микросервиса (например, "marketplace-api")
- `environment`: `production`, `staging`, `development`
- `trace_id` / `span_id`: Для корреляции с трейсами OpenTelemetry
- `tenant_id`: ID организации-арендатора (для B2B контекста)
- `user_id`: ID инициатора запроса
- `message`: Человекочитаемое описание
- `caller`: Имя файла и строка кода
- `context`: Вложенный JSON-объект с деталями специфичными для события

## 2. Правила фильтрации и безопасности (PII Sanitization)
- **Строгий запрет на логирование**: паролей, полных номеров банковских карт, секретов API, паспортных данных водителей.
- **Маскирование (Masking)**: Персональные данные должны быть замаскированы. Например, `phone: "+7 (999) ***-**-12"`, `email: "a***@gmail.com"`.

## 3. Пайплайн сбора логов
Поток данных: `Stdout контейнера → Vector / FluentBit DaemonSet (в Kubernetes) → Grafana Loki / OpenSearch → Grafana UI`.
