# Runbook: Падение поискового кластера OpenSearch

## 1. Симптомы и триггеры алертов
- **Алерт**: `OpenSearchClusterRed` (P1).
- **Симптом**: 500 ошибки на эндпоинтах поиска `GET /api/v1/loads`, таймауты.

## 2. Диагностика
```bash
curl -X GET "http://opensearch:9200/_cluster/health?pretty"
```

## 3. Стратегия деградации (Graceful Degradation)
- API Gateway (или Search Service) автоматически переключает эндпоинт поиска на аварийный **Fallback Handler**.
- Fallback Handler выполняет прямой SQL-запрос к PostgreSQL с жесткими лимитами (`LIMIT 20`), без полнотекстовых и гео-радиусных вычислений.
- UI отображает желтую плашку: «Поиск работает в упрощенном режиме из-за технических работ».

## 4. Пошаговый алгоритм восстановления
- Восстановление упавших Data нод:
```bash
kubectl get pods -n opensearch
kubectl scale sts opensearch-data --replicas=3
```
- Перевод Unassigned shards: `POST /_cluster/reroute?retry_failed=true`.

## 5. Проверка корректности восстановления
- Дождаться перехода статуса кластера в Green.
- Вызвать API сброса Outbox-событий в Kafka для догоняющей синхронизации (Catch-up sync).

## 6. Пост-действия
Просмотр дашбордов JVM памяти и GC пауз. Расширение RAM при необходимости.
