# Каталог алертов (Prometheus Alertmanager)

## Градация критичности и правила

### P1 (Critical / Page duty)
Критические сбои с немедленной эскалацией (Opsgenie -> Звонок / SMS дежурному).
- Падение Primary БД: `up{job="postgresql-primary"} == 0`
- Лаг Kafka > 100k сообщений: `kafka_consumer_lag_records > 100000`
- Недоступность поиска > 1 мин: `rate(http_requests_errors_total{service="search"}[1m]) > 0.05`
- 5xx ошибки API > 2%: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.02`

### P2 (Warning)
Проблемы, требующие вмешательства в течение рабочего дня (Оповещение в Telegram/Slack On-call).
- Рост задержки API p99 > 1.5s: `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1.5`
- Задержка приема GPS > 30s: `gps_ingestion_delay_seconds_p99 > 30`
- Рост использования диска > 85%: `node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.15`

### P3 (Info)
Оповещения справочного характера, отправляются в Email / выделенный лог-канал.
- Неуспешная доставка одиночного вебхука клиенту.

## Матрица эскалации
- Канал Critical: PagerDuty / Opsgenie (Дежурный SRE -> Team Lead).
- Канал Warning: Telegram бот в группу платформенной команды.
