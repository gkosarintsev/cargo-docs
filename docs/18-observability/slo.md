# Соглашения об уровне обслуживания (SLI / SLO) и Управление Бюджетом Ошибок (Error Budgets)

## 1. Матрица целевых показателей (Service Level Objectives)

Период оценки: скользящее окно **30 дней** (Rolling 30-Day Window).

| Сервис / Доменная операция | Service Level Indicator (SLI) | Целевой SLO | Допустимый Error Budget (30 дней) |
| :--- | :--- | :--- | :--- |
| **Search & Matching API** | Доля успешных запросов поиска грузов с задержкой $T < 350\text{ ms}$ | **99.5%** | 0.5% (~3.6 часа деградации) |
| **Core Order & Booking API** | Доля успешных транзакций (HTTP status < 500) | **99.95%** | 0.05% (~21.6 мин простоя) |
| **GPS Telemetry Ingestion** | Доля успешно принятых и распарсенных точек без потерь пакетов | **99.99%** | 0.01% (~4.3 мин простоя) |
| **Live Dispatcher WebSocket** | Время непрерывной доступности WebSocket стриминга телеметрии | **99.9%** | 0.1% (~43.2 мин простоя) |
| **Electronic Documents (ЭТрН)** | Время генерации и валидации подписи документа $T < 1.5\text{ сек}$ | **99.0%** | 1.0% (~7.2 часа деградации) |

---

## 2. Формулы вычисления метрик (PromQL)

### 2.1 SLI доступности Core Order API (Success Rate)

$$\text{SLI}_{\text{orders}} = \frac{\sum \text{rate}(\text{http\_requests\_total}\{\text{status} !~ \text{"5.."}\}[30d])}{\sum \text{rate}(\text{http\_requests\_total}[30d])}$$

**PromQL:**
```promql
sum(rate(http_requests_total{job="order-service", status!~"5.."}[30d]))
/
sum(rate(http_requests_total{job="order-service"}[30d]))
```

---

### 2.2 SLI задержки Search & Matching API (Latency P95)

Доля запросов поиска грузов, ответивших быстрее 350мс:

**PromQL:**
```promql
sum(rate(http_request_duration_seconds_bucket{job="marketplace-service", endpoint="/api/v1/loads/search", le="0.35"}[30d]))
/
sum(rate(http_request_duration_seconds_count{job="marketplace-service", endpoint="/api/v1/loads/search"}[30d]))
```

---

### 2.3 SLI потерь пакетов GPS телеметрии

**PromQL:**
```promql
1 - (
  sum(rate(telemetry_ingest_packets_dropped_total[30d]))
  /
  sum(rate(telemetry_ingest_packets_received_total[30d]))
)
```

---

## 3. Политика расхода Бюджета Ошибок (Multi-Window Multi-Burn-Rate Alerts)

Для исключения ложных срабатываний и своевременного обнаружения быстрого расхода бюджета ошибок применяются правила по методологии Google SRE:

```yaml
groups:
  - name: slo_alerts_order_service
    rules:
      # Критический алерт: Сжигание 14.4x бюджета за 1 час (2% бюджета за час -> вызов инженера)
      - alert: OrderServiceErrorBudgetFastBurn
        expr: |
          (
            sum(rate(http_requests_total{job="order-service", status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total{job="order-service"}[1h]))
          ) > (1 - 0.9995) * 14.4
        for: 2m
        labels:
          severity: page
          domain: orders
        annotations:
          summary: "Быстрое сжигание Error Budget сервиса заказов (Burn Rate 14.4x)"
          runbook_url: "docs/19-operations/runbooks/database-failover.md"

      # Предупредительный алерт: Сжигание 6x бюджета за 6 часов (5% бюджета за 6ч -> тикет дежурному)
      - alert: OrderServiceErrorBudgetSlowBurn
        expr: |
          (
            sum(rate(http_requests_total{job="order-service", status=~"5.."}[6h]))
            /
            sum(rate(http_requests_total{job="order-service"}[6h]))
          ) > (1 - 0.9995) * 6
        for: 15m
        labels:
          severity: warning
          domain: orders
        annotations:
          summary: "Медленное сжигание Error Budget сервиса заказов (Burn Rate 6x)"
```

---

## 4. Регламент действий при исчерпании бюджета (Policy on Budget Exhaustion)

Если в течение скользящего 30-дневного окна остаток бюджета ошибок опускается ниже **10%**:
1. **Feature Freeze**: Замораживаются все некритические релизы новых фич в соответствующем домене.
2. **Фокус на надежность**: 100% инженерного ресурса команды перенаправляется на устранение техдолга, оптимизацию узких мест в БД, покрытие тестами и повышение отказоустойчивости.
3. **Разбор инцидентов (Post-Mortem)**: Проведение обязательного анализа первопричин (RCA) по каждому инциденту с принятием превентивных мер до возобновления релизного цикла.
