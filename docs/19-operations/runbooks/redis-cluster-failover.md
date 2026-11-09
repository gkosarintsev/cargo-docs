# Runbook: Деградация и аварийное переключение Redis Cluster (Failover)

## 1. Симптомы и триггеры алертов
- **Алерт**: `RedisClusterMasterDown` (P1) или `RedisClusterNodeDisconnected`.
- **Симптом**: Ошибки `MOVED` / `CLUSTERDOWN The cluster is down` в логах Gateway и Matching Engine.
- **Влияние на бизнес**: Замедление поиска грузов по геохэшу (вместо субмиллисекундного ответа из RAM запросы идут в PostGIS БД), сброс активных WebSocket сессий авторизации.

---

## 2. Диагностика состояния узлов кластера

```bash
# 1. Проверка слотов и состояния мастеров/реплик
redis-cli -h redis-cluster.internal -p 6379 cluster nodes

# 2. Проверка состояния конкретного сбойного мастера
redis-cli -h redis-cluster.internal -p 6379 cluster info | grep -E "cluster_state|cluster_slots_ok|cluster_slots_fail"

# 3. Проверка логов пода Redis
kubectl logs -n redis statefulset/redis-node-2 --tail=100
```

---

## 3. Пошаговый регламент восстановления

### Сценарий A: Автоматический Failover не сработал из-за потери кворума
Если мастер упал, но реплика не смогла автоматически перехватить слоты:
```bash
# 1. Подключаемся к подовой реплике сбойного мастера
kubectl exec -it redis-node-replica-2 -n redis -- redis-cli

# 2. Принудительное назначение реплики новым мастером (Failover takeover)
CLUSTER FAILOVER TAKEOVER
```

### Сценарий B: Кластер полностью потерял доступ к слотам (`cluster_state:fail`)
```bash
# Исправление распределения слотов через консоль redis-cli
redis-cli --cluster fix redis-cluster.internal:6379
```

### Сценарий C: Переключение приложений в режим деградации (Bypass Cache)
Если восстановление Redis занимает более 5 минут, активируем в сервисах шлюза режим прямого обращения в PostgreSQL:
```bash
kubectl set env deployment/marketplace-service CACHE_BYPASS_ENABLED=true -n production
```
*Примечание:* Это увеличит нагрузку на реплики PostgreSQL, поэтому параллельно масштабируем пул read-реплик БД:
```bash
kubectl scale statefulset postgres-replica -n production --replicas=5
```

---

## 4. Проверка корректности работы
1. `cluster_state` возвращается в значение `ok`.
2. `cluster_slots_ok` = 16384 (все слоты охвачены).
3. Отключение флага `CACHE_BYPASS_ENABLED` в сервисах платформы.
4. Проверка latency гео-индекса:
   ```bash
   redis-cli -h redis-cluster.internal --latency
   ```
