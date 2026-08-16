# Промпт 37 — Эксплуатация, Disaster Recovery, Аварийные сценарии и Runbooks

> **Файлы на выходе:**
>
> - `docs/19-operations/deployment.md`
> - `docs/19-operations/environments.md`
> - `docs/19-operations/ci-cd.md`
> - `docs/19-operations/backups.md`
> - `docs/19-operations/disaster-recovery.md`
> - `docs/19-operations/incident-management.md`
> - `docs/19-operations/runbooks/database-failover.md`
> - `docs/19-operations/runbooks/kafka-unavailable.md`
> - `docs/19-operations/runbooks/search-unavailable.md`

---

## Контекст

Проектируем раздел **19-operations** (Этап 12).
Специфицируем операционный регламент промышленной эксплуатации платформы: CI/CD пайплайны, стратегию резервного копирования, план аварийного восстановления (Disaster Recovery Plan), управление инцидентами и пошаговые инструкции (Runbooks) для дежурных инженеров при сбоях ключевых компонентов (из §30 и §31 master-prompt).

Язык — **русский**.

---

## Задание 1: создай документы инфраструктуры и процессов

1. **`deployment.md` и `environments.md`**:
   - Управление конфигурациями (GitOps: ArgoCD / Flux).
   - Спецификация сред: Dev, Staging, Production (изоляция сетей, квоты ресурсов, правила доступа).
2. **`ci-cd.md`**:
   - Пайплайн GitHub Actions / GitLab CI: Lint → Unit Tests → Build & Scan Docker (Trivy) → Integration / Contract Tests → Deploy to Staging → Automated E2E → Canary Deploy to Prod → Healthcheck → Full Rollout.
3. **`backups.md`**:
   - Регламент бэкапов:
     - PostgreSQL: непрерывное WAL-G архивирование в S3 + ежедневный полный снэпшот (LVM/EBS).
     - OpenSearch: ежедневные снэпшоты индексов в S3.
     - S3 Object Storage: Cross-Region Versioning и Replication.
   - Регулярные учения по восстановлению (Disaster Recovery Drills раз в квартал).

---

## Задание 2: создай `docs/19-operations/disaster-recovery.md` и `incident-management.md`

1. **`disaster-recovery.md` (План аварийного восстановления / DRP)**:
   - Классификация данных: **Critical** (Orders, IAM, Payments: RPO = 0, RTO < 15 мин), **Recoverable** (OpenSearch search index: RPO < 1 час, RTO < 2 часов), **Ephemeral** (Redis Cache: RPO = N/A, RTO < 5 мин).
   - Сценарии катастроф:
     - Сценарий A: Полный отказ основного дата-центра / зоны доступности (AZ Outage).
     - Сценарий B: Логическое повреждение данных (Ransomware / ошибочный `DROP TABLE`).
     - Сценарий C: Массовый сбой DNS / сетевого магистрального провайдера.
2. **`incident-management.md` (Управление инцидентами)**:
   - Жизненный цикл инцидента: `Detection → Triage → Containment → Resolution → Post-Mortem`.
   - Роли: Incident Commander, Communications Lead, Operations Lead.
   - Шаблон постмортема (Blameless Post-Mortem): таймлайн, первопричина (5 Whys), корректирующие действия.

---

## Задание 3: создай пошаговые инструкции (Runbooks)

Каждый Runbook строится по строгой структуре:

```
1. Симптомы и триггеры алертов (Prometheus Alerts)
2. Диагностика (Команды проверки статуса, логов, метрик)
3. Стратегия деградации (Что отключить, чтобы сохранить ядро системы)
4. Пошаговый алгоритм восстановления (Step-by-step remediation)
5. Проверка корректности восстановления (Verification checks)
6. Пост-действия
```

### Спецификация файлов Runbooks:

1. **`runbooks/database-failover.md` (Аварийное переключение PostgreSQL)**:
   - Симптом: Primary нода не отвечает > 30 сек, алерт `PostgresPrimaryDown`.
   - Диагностика: проверка Patroni etcd кворума, сетевой доступности.
   - Процедура: автоматический failover через Patroni. Ручной failover: `patroni_ctl switchover`. Проверка целостности данных и репликации.

2. **`runbooks/kafka-unavailable.md` (Недоступность кластера Apache Kafka)**:
   - Симптом: Алерт `KafkaBrokersUnreachable`, таймауты продюсеров.
   - Стратегия деградации:
     - Приложения продолжают писать в Transactional Outbox таблицу в PostgreSQL без сбоев для клиентов!
     - Ingestion Gateway телеметрии начинает локальную буферизацию на дисковый кэш.
   - Восстановление: рестарт брокеров / контроллеров Kraft, дрейн очередей Outbox Worker-ом с ограничением скорости (Rate Limiting).

3. **`runbooks/search-unavailable.md` (Падение поискового кластера OpenSearch)**:
   - Симптом: Алерт `OpenSearchClusterRed`, 500 ошибки на `GET /api/v1/loads`.
   - Стратегия деградации:
     - API Gateway переключает эндпоинт поиска на аварийный Fallback Handler (прямой базовый SQL-запрос в PostgreSQL с лимитом `limit=20` без сложного радиуса).
     - Отображение в UI плашки «Поиск работает в упрощенном режиме».
   - Восстановление: восстановление шардов, запуск фоновой синхронизации из Outbox/PostgreSQL.

---

## Важные замечания для выполнения

- Инструкции Runbooks должны содержать реальные shell-команды (`kubectl`, `psql`, `curl`) и точные алгоритмы действий.
- Четко покажи паттерны Graceful Degradation для каждого типа сбоя.
