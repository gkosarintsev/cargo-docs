# Runbook: Недоступность кластера Apache Kafka

## 1. Симптомы и триггеры алертов
- **Алерт**: `KafkaBrokersUnreachable` (P1), `KafkaUnderReplicatedPartitions`.
- **Симптом**: Таймауты продюсеров, отставание консьюмеров.

## 2. Диагностика
```bash
kubectl get pods -n kafka
kubectl logs -l app=kafka
kafka-topics.sh --describe --bootstrap-server kafka:9092 --under-replicated-partitions
```

## 3. Стратегия деградации
- Приложения продолжают писать события в **Transactional Outbox таблицу** в PostgreSQL без сбоев для конечных API клиентов!
- Ingestion Gateway телеметрии начинает локальную буферизацию пакетов на дисковый кэш. Уведомления откладываются.

## 4. Пошаговый алгоритм восстановления
- Перезапуск брокеров сбойной зоны: `kubectl rollout restart statefulset kafka-broker`.
- Проверка доступности Zookeeper/Kraft контроллеров.

## 5. Проверка корректности восстановления
Запуск фонового дрейнинга очередей Outbox Worker-ом с ограничением скорости (Rate Limiting) во избежание DDoS кластера:
```bash
curl -X POST http://outbox-worker/metrics/resume
```

## 6. Пост-действия
Анализ логов брокеров. Корректировка ресурсов (JVM Heap / Disk IOPS).
