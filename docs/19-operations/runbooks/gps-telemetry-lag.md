# Runbook: Критическое отставание обработки GPS-телеметрии (Consumer Group Lag)

## 1. Симптомы и триггеры алертов
- **Prometheus Алерт**: `KafkaConsumerGroupLagCritical` (P1 — severity: page).
- **Метрика**: `kafka_consumergroup_lag{topic="telemetry.gps.v1", consumergroup="tracking-engine"} > 500000` в течение более 3 минут.
- **Внешний симптом**: Маркеры машин на Диспетчерском пульте «зависают» или обновляются с задержкой 5-15 минут, задержка расчета прогноза ETA и детекции геозон.

---

## 2. Первичная экспресс-диагностика

```bash
# 1. Проверка отставания по партициям топика телеметрии
kafka-consumer-groups.sh --bootstrap-server kafka:9092 \
  --describe --group tracking-engine

# 2. Проверка состояния подов потребителей в Kubernetes
kubectl get pods -n production -l app=tracking-engine -o wide

# 3. Анализ нагрузки на CPU/Память и OOMKill
kubectl top pods -n production -l app=tracking-engine
kubectl describe pod -n production -l app=tracking-engine | grep -i oom

# 4. Проверка задержек записи в PostgreSQL / TimescaleDB
kubectl logs -n production -l app=tracking-engine --tail=200 | grep -i -E "timeout|slow query|connection pool"
```

---

## 3. Возможные причины сбоя

1. **Пиковый наплыв пакетов (Spike)**: Массовый одновременный выход сотен ТС на маршруты (утренний пик 08:00–09:00).
2. **Деградация БД (Database Slowdown)**: Пакетный `INSERT` в `telemetry_pings` уперся в дисковые IOPS или нехватку соединений в пуле (PgBouncer).
3. **Зависание на внешнем геокодере**: Потребитель синхронно вызывает картографический сервис вместо асинхронного локального кэша.
4. **Нехватка партиций**: Число реплик consumer pod превысило количество партиций топика (idle consumers).

---

## 4. Пошаговый алгоритм устранения

### Шаг 1: Автомасштабирование консьюмеров (Horizontal Pod Autoscaling)
Если число партиций топика позволяет (в production выделено 32 партиции на `telemetry.gps.v1`), немедленно увеличиваем число реплик:
```bash
kubectl scale deployment tracking-engine -n production --replicas=32
```

### Шаг 2: Включение режима деградации (Load Shedding)
Если база данных перегружена, активируем флаг временного пропуска промежуточных точек стоянки (Downsampling):
```bash
# Перевод сервиса в режим сохранения только точек в движении (speed > 5 км/ч):
curl -X POST http://tracking-engine.internal/admin/features/enable-telemetry-downsampling \
  -H "Authorization: Bearer $OPS_TOKEN"
```
Это снижает нагрузку на запись в PostgreSQL на 65% без потери точности активных рейсов.

### Шаг 3: Проверка пула соединений PgBouncer
```bash
psql -h pgbouncer.internal -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
psql -h pgbouncer.internal -p 6432 -U pgbouncer pgbouncer -c "SHOW CLIENTS;"
```
При исчерпании пула временно увеличиваем `default_pool_size` со 100 до 250.

---

## 5. Проверка восстановления и нормализации
- Метрика `kafka_consumergroup_lag` стабильно снижается со скоростью > 50 000 сообщений/мин.
- Значение лага вернулось к норме (< 5 000 пакетов).
- На Диспетчерском пульте маркеры вернулись в статус «Телеметрия: только что».
- Отключение режима downsampling:
  ```bash
  curl -X POST http://tracking-engine.internal/admin/features/disable-telemetry-downsampling \
    -H "Authorization: Bearer $OPS_TOKEN"
  ```
