# Промпт 03 — Domain Map и Bounded Contexts

> **Файлы на выходе:**
>
> - `docs/01-product-and-domain/domain-map.md`
> - `docs/01-product-and-domain/bounded-contexts.md`

---

## Контекст

Проектируем ядро предметной области для логистической платформы (аналог ATI.SU, Trans.eu, TIMOCOM, Uber Freight).
Главный принцип проектирования (из §3 master-prompt):

1. Не выбирать технологии сразу.
2. Сначала определить business domain, bounded contexts, actors, entities, business processes, state machines, requirements, integration boundaries.
3. Не проектировать микросервисы автоматически только из-за high-load.
4. Чётко специфицировать границы каждого контекста.

Документация пишется **на русском языке**, диаграммы — **Mermaid**.

---

## Задание 1: создай `docs/01-product-and-domain/domain-map.md`

### Содержимое документа

1. **Концептуальная карта домена**
   - Mermaid-диаграмма (Context Map), показывающая все Bounded Contexts и типы взаимосвязей между ними (Shared Kernel, Customer/Supplier, Conformist, Anti-Corruption Layer, Open Host Service / Published Language).
2. **Категоризация контекстов**
   - **Core Domains** (конкурентное преимущество): Marketplace, Matching & Negotiation, Transport Execution, Trust & Reputation.
   - **Supporting Domains** (поддержка основных процессов): Fleet, Tracking & Location, Document Management, Finance & Settlement, Communication.
   - **Generic Domains** (стандартные задачи): Identity & Access, Notification Gateway, Analytics & Reporting, Integration Layer.
3. **Таблица стратегического маппинга (Context Matrix)**:
   - Взаимодействующие пары контекстов
   - Характер отношений (Upstream/Downstream)
   - Способ интеграции (Sync REST/gRPC, Async Events / Outbox)

---

## Задание 2: создай `docs/01-product-and-domain/bounded-contexts.md`

### Содержимое документа

Подробно опиши следующие **12 Bounded Contexts**:

1. **Identity & Access Management (IAM)**
2. **Marketplace (Loads & Trucks Board)**
3. **Matching & Negotiation Engine**
4. **Transport Order & Execution (TMS)**
5. **Fleet & Driver Management**
6. **Location & GPS Tracking**
7. **Document Management & E-Signature (EDO)**
8. **Billing, Pricing & Settlement (Finance)**
9. **Trust, Verification & Reputation**
10. **Communication & Collaboration (Messenger)**
11. **Integration Platform (External TMS/ERP/WMS)**
12. **Analytics, Market Insights & Reporting**

### Обязательный шаблон описания для каждого Bounded Context:

Для каждого контекста приведи разделы:

- **Назначение и бизнес-ответственность**: какую задачу решает, границы ответственности.
- **Владение данными (Data Ownership)**:
  - Какие сущности принадлежат контексту (Source of Truth).
  - К каким данным контекст имеет доступ только на чтение (Replicas/Read Models).
  - Какие данные контекст категорически не должен модифицировать.
- **Предоставляемые API (Inbound Interfaces)**: команды, запросы, открытые контракты.
- **Публикуемые события (Published Domain Events)**: список событий с кратким назначением.
- **Потребляемые события (Consumed Domain Events)**: от кого и зачем.
- **Требования к консистентности (Consistency Requirements)**: где необходима Strong Consistency (ACID в транзакции), где применима Eventual Consistency.
- **Характер нагрузки (Workload Profile)**: соотношение Read/Write, пиковые профили (RPS, объём данных).
- **Хранилище данных (Storage Strategy)**: нужна ли отдельная БД или схема, тип хранилища (Postgres, Redis, TimescaleDB, OpenSearch) с обоснованием.
- **Deployment Unit (MVP vs Evolution)**: является ли модулем в монолите на этапе MVP или сразу отдельным сервисом, критерии выделения в микросервис при росте.

---

## Важные замечания для выполнения

1. Не создавай искусственных микросервисов для простых справочников.
2. Чётко объясни разницу между контекстом маркетплейса (поиск/офферы) и контекстом исполнения перевозки (заказы/статусы).
3. Все ссылки оформи в виде относительных ссылок на файлы документации.
