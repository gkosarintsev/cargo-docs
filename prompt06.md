# Промпт 06 — Обзор архитектуры, принципы и эволюция (MVP → Growth → Scale)

> **Файлы на выходе:**
>
> - `docs/03-architecture/architecture-overview.md`
> - `docs/03-architecture/principles.md`

---

## Контекст

Проектируем архитектуру распределенной логистической платформы.
Главное требование: реалистичная эволюция архитектуры (из §40 master-prompt). Не начинать с распределенного оверхеда из 50 микросервисов, но сразу заложить строгие модульные границы для безболезненного масштабирования.

Язык — **русский**. Диаграммы — **Mermaid**.

---

## Задание 1: создай `docs/03-architecture/architecture-overview.md`

### Содержимое документа

1. **Концепция трехуровневой эволюции платформы:**
   - **Фаза 1 (MVP — Fast Time-to-Market)**:
     - Архитектурный стиль: Модульный монолит (Modular Monolith) с четкими границами Bounded Contexts внутри одного репозитория/кодовой базы.
     - Инфраструктура: Managed PostgreSQL (OLTP) + Redis (кэш, pub/sub, сессии) + OpenSearch/Elasticsearch (поиск грузов/машин) + S3-совместимое Object Storage (документы, фото PoD).
     - Межмодульное взаимодействие: In-process Event Bus с поддержкой Transactional Outbox (для безопасного перехода на брокер сообщений).
   - **Фаза 2 (Growth — Scaling Bottlenecks)**:
     - Причины перехода: экспоненциальный рост объема телематики и поискового трафика.
     - Выделяемые автономные сервисы: GPS Ingestion Gateway, Notification Service, Search Indexer Pipeline, Document Processing Worker.
     - Внедрение Apache Kafka для асинхронного стриминга событий и телеметрии.
   - **Фаза 3 (Large Scale — High Load & Multi-region)**:
     - Разделение на независимые микросервисы для наиболее нагруженных контекстов: Marketplace Core, Matching Engine, Fleet & Telematics, Billing & Settlement, Analytics Cluster (ClickHouse).
     - Внедрение Service Mesh, Distributed Caching, Multi-AZ / Multi-Region репликации.

2. **Архитектурный ландшафт (High-level Architecture Diagram):**
   - Mermaid-диаграмма компонентов: Клиенты (Web SPA, Driver Mobile App, TMS API Consumers) → CDN / WAF → API Gateway / Reverse Proxy → Сервисный слой → Хранилища данных.

3. **Матрица эволюции компонентов:**
   - Таблица с колонками: Компонент | Фаза 1 (MVP) | Фаза 2 (Growth) | Фаза 3 (Large Scale) | Технический триггер миграции.

---

## Задание 2: создай `docs/03-architecture/principles.md`

### Содержимое документа

1. **Ключевые архитектурные принципы (минимум 12 принципов с развернутым обоснованием):**
   - _Domain-Driven Design First_: первичность бизнес-модели над технологиями.
   - _Single Source of Truth & Clear Ownership_: каждый контекст владеет своими таблицами; прямой доступ к чужим БД строго запрещен.
   - _Event-Driven Inter-context Communication_: асинхронное взаимодействие через надежные Integration Events (с Transactional Outbox).
   - _Idempotency by Design_: обязательная идемпотентность всех мутирующих API и обработчиков событий.
   - _Defensive Telematics Ingestion_: изоляция ненадежных и высокочастотных GPS-потоков от транзакционного ядра.
   - _Strict Separation of Load vs Order vs Shipment_: предотвращение антипаттерна "God Object Order".
   - _Stateless Compute Layer_: все инстансы приложений не хранят сессионного состояния локально.
   - _Fail-Fast & Graceful Degradation_: использование Circuit Breaker, Retries с экспоненциальным backoff и дефолтных fallback-ответов.
   - _Security in Depth & Tenant Isolation_: проверка прав и tenant_id на каждом уровне.
   - _Comprehensive Observability_: сквозной TraceId во всех запросах, логах и сообщениях Kafka.
   - _Zero-Downtime Database Migrations_: паттерн Expand/Contract для схем БД.
   - _Cost-Aware Scalability_: баланс между производительностью и стоимостью облачной инфраструктуры.

2. **Список архитектурных антипаттернов, которые строго запрещены в проекте (на основе §36 master-prompt):**
   - Прямые SQL-джойны между схемами разных контекстов.
   - Запись GPS-координат в таблицу заказов.
   - Использование PostgreSQL как основного движка полнотекстового и гео-поиска маркетплейса при высоких нагрузках.
   - Синхронные цепочки из 5+ вызовов между сервисами при обработке одного HTTP-запроса.
   - Использование брокера сообщений Kafka как единственного Source of Truth для транзакционных бизнес-сущностей.
   - "Микросервис на каждую таблицу БД".
   - Игнорирование дубликатов сообщений и нарушения порядка телеметрии.
