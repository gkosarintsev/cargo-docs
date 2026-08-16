# Промпт 05 — Нефункциональные требования (NFR)

> **Файлы на выходе:**
>
> - `docs/02-requirements/non-functional-requirements.md`
> - `docs/02-requirements/scalability.md`
> - `docs/02-requirements/availability.md`
> - `docs/02-requirements/security.md`
> - `docs/02-requirements/observability.md`
> - `docs/02-requirements/compliance.md`
> - `docs/02-requirements/disaster-recovery.md`

---

## Контекст

Формируем полную спецификацию нефункциональных требований (NFR) для распределенной логистической платформы.
Система должна быть устойчивой к всплескам нагрузки (сезонность, маркетинговые акции), обеспечивать строгую изоляцию тенантов, безопасную обработку платежей и юридически значимых документов, а также гарантировать высокую доступность телематического контура.

Язык — **русский**. Все метрики должны быть количественно измеримыми.

---

## Задание 1: создай `docs/02-requirements/non-functional-requirements.md`

Сводная матрица NFR по категориям (Performance, Scalability, Availability, Security, Observability, Maintainability, Usability, Compliance) с уникальными ID (`NFR-PERF-01`, `NFR-AVAIL-01` и т.д.), целевыми значениями, методами валидации и ссылками на специализированные документы раздела.

---

## Задание 2: создай `docs/02-requirements/scalability.md`

### Содержимое документа

1. **Модель нагрузки по трем профилям:**
   - **Normal (Базовый рабочий день)**
   - **Peak (Конец месяца / сезонный пик перевозок)**
   - **Extreme / Stress (Маркетинговые промо-кампании, форс-мажорные миграции с других платформ)**

   Сформируй детальную таблицу метрик для всех 3 профилей:
   - Зарегистрированные организации и активные пользователи (DAU/MAU)
   - Активный парк ТС под трекингом
   - Публикуемые грузы/сутки и офферы/сутки
   - Создаваемые транспортные заказы/сутки
   - Поток GPS-телематики (пакетов/сек, сетевой трафик)
   - Read/Write RPS для основных API эндпоинтов (поиск, трекинг, мессенджер)
   - Поток поисковых запросов (Search RPS, p95/p99 latency)
   - Рост хранилища (GB/сутки для БД, TimeSeries, Object Storage)

2. **Оси масштабирования по подсистемам (Scaling Dimensions):**
   - API Gateway & Stateless Services (горизонтальное автомасштабирование HPA)
   - Поисковый кластер (sharding, replication по геолокациям)
   - GPS Ingestion Pipeline (партиционирование Kafka по device_id/vehicle_id)
   - Транзакционные БД (Read Replicas, вертикальное масштабирование, Connection Pooling, будущее партиционирование)
   - TimeSeries / GPS History (горизонтальное шардирование, retention policies)
   - Мессенджер и WebSocket-шлюзы (Sticky Sessions, Redis Pub/Sub, балансировка соединений)

---

## Задание 3: создай `docs/02-requirements/availability.md`

1. **SLA/SLO/SLI матрица по сервисам:**
   - Marketplace Search: 99.9% доступность, p95 < 200ms, p99 < 800ms
   - Order Creation & Core API: 99.95% доступность, p95 < 150ms
   - GPS Ingestion Gateway: 99.99% доступность, zero packet drop на входе
   - Dispatcher Live Tracking Map: 99.5% доступность, задержка отображения < 3 сек
   - Document Signing & EDO: 99.9% доступность
2. **Graceful Degradation (Режимы контролируемой деградации):**
   - Что происходит при отказе OpenSearch (переключение на базовый кэшированный фильтр в Postgres или read-only сообщение).
   - Что происходит при перегрузке GPS шлюза (буферизация на мобильных клиентах, сброс второстепенных телеметрических полей).
   - Поведение системы при сбоях внешних SMS/Email/Push провайдеров.

---

## Задание 4: создай `docs/02-requirements/security.md`

1. Требования к аутентификации (MFA для финансовых операций, OAuth2/OIDC, JWT rotation).
2. Модель разграничения прав (RBAC/ABAC) с учетом multi-tenancy.
3. Шифрование данных (Data at Rest: AES-256; Data in Transit: TLS 1.3, mTLS для интеграций).
4. Защита от злоупотреблений (Rate Limiting, WAF, защита от скрапинга грузов, anti-DDoS).
5. Неизменяемость журналов аудита (Immutable Audit Logs) для ключевых действий.

---

## Задание 5: создай `docs/02-requirements/observability.md`

1. **Метрики (RED/USE)**: ключевые бизнес- и системные метрики.
2. **Логирование**: единый JSON-формат, контекст корреляции (TraceId, SpanId, TenantId, UserId).
3. **Распределенный трейсинг (Tracing)**: сквозные трассы от мобильного приложения через API Gateway до асинхронных потребителей событий.
4. **Алертинг**: градация Severity (P1-Blocker, P2-Critical, P3-Warning) и каналы доставки (Opsgenie, Telegram, PagerDuty).

---

## Задание 6: создай `docs/02-requirements/compliance.md` и `disaster-recovery.md`

1. **`compliance.md`**:
   - Соответствие законодательству о персональных данных (152-ФЗ / GDPR).
   - Требования к хранению и подписанию электронных перевозочных документов (ГИС ЭПД / eCMR).
   - Сроки обязательного хранения первичных документов и финансовых проводок.
2. **`disaster-recovery.md`**:
   - Классификация данных: **Critical** (Заказы, финансы, профили), **Recoverable** (Индексы поиска), **Ephemeral** (Кэш, временные сессии).
   - Целевые показатели: RPO (Recovery Point Objective) и RTO (Recovery Time Objective) для каждой категории.
   - Стратегия резервного копирования (WAL-архивирование, снэпшоты, cross-region replication).
