# План создания документации логистической платформы

Верхнеуровневый план по созданию полной технической документации на основе `master-prompt.md`.
Каждый промпт — отдельный файл `promptNN.md`, вызываемый последовательно.

---

## Условные обозначения

| Символ | Смысл     |
| ------ | --------- |
| `[ ]`  | Не начато |
| `[/]`  | В работе  |
| `[x]`  | Завершено |

---

## Этап 1 — Фундамент: продукт и домен

| #   | Промпт                                | Создаваемые файлы                                                                                                        | Секции master-prompt |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| 01  | Структура docs/, README, глоссарий    | `docs/README.md`, `docs/glossary/glossary.md`                                                                            | §4, §37              |
| 02  | Обзор продукта, акторы, бизнес-модель | `docs/01-product-and-domain/product-overview.md`, `actors-and-roles.md`, `business-capabilities.md`, `business-model.md` | §1, §2               |
| 03  | Domain Map и Bounded Contexts         | `docs/01-product-and-domain/domain-map.md`, `bounded-contexts.md`                                                        | §3                   |

---

## Этап 2 — Требования

| #   | Промпт                                 | Создаваемые файлы                                                                                                                                                      | Секции master-prompt |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 04  | Функциональные требования              | `docs/02-requirements/functional-requirements.md`                                                                                                                      | §7–§25               |
| 05  | NFR: масштабируемость, доступность, DR | `docs/02-requirements/non-functional-requirements.md`, `scalability.md`, `availability.md`, `security.md`, `observability.md`, `compliance.md`, `disaster-recovery.md` | §28, §29, §31        |

---

## Этап 3 — Архитектура

| #   | Промпт                                          | Создаваемые файлы                                                                                                             | Секции master-prompt |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 06  | Обзор архитектуры, принципы, MVP→Growth→Scale   | `docs/03-architecture/architecture-overview.md`, `principles.md`                                                              | §3, §36, §40         |
| 07  | System Context, C4 Level 1–3 (PlantUML)         | `docs/03-architecture/system-context.md`, `c4/01-system-context.puml`, `c4/02-containers.puml`, `c4/03-components/*.puml`     | §34                  |
| 08  | Deployment, Data Architecture, Integration Arch | `docs/03-architecture/deployment-model.md`, `data-architecture.md`, `integration-architecture.md`, `security-architecture.md` | §19, §40             |
| 09  | Architectural Views (4+1)                       | `docs/03-architecture/views/logical-view.md`, `runtime-view.md`, `deployment-view.md`, `data-flow-view.md`                    | §34                  |
| 10  | ADR 0001–0008                                   | `docs/03-architecture/adr/0000-template.md`, `0001-architecture-style.md` … `0008-multi-tenancy.md`                           | §33, §15             |
| 11  | ADR 0009–0015                                   | `docs/03-architecture/adr/0009-gps-ingestion.md` … `0015-deployment-topology.md`                                              | §33                  |

---

## Этап 4 — Domain Model

| #   | Промпт                                                                                         | Создаваемые файлы                                                                | Секции master-prompt |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------- |
| 12  | Domain Model, агрегаты, обоснование разделения                                                 | `docs/04-domain/domain-model.md`, `aggregates.md`                                | §5, §6               |
| 13  | Entities, Value Objects, инварианты, политики                                                  | `docs/04-domain/entities.md`, `value-objects.md`, `invariants.md`, `policies.md` | §5                   |
| 14  | Domain Events — полный каталог                                                                 | `docs/04-domain/domain-events.md`                                                | §16                  |
| 15  | State Machines (Load, Offer, Negotiation, Order, Shipment, Document, Payment, Driver, Vehicle) | `docs/04-domain/state-machines/*.md` (9 файлов)                                  | §12, §34             |
| 16  | Sequence Diagrams + Core ERD                                                                   | `docs/04-domain/sequence-diagrams/*.md` (6 файлов), `docs/04-domain/erd/core.md` | §34                  |

---

## Этап 5 — Бизнес-процессы

| #   | Промпт                                          | Создаваемые файлы                                                                                | Секции master-prompt |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| 17  | Use Cases (Shipper, Carrier, Dispatcher, Admin) | `docs/05-business-processes/use-cases/*.md` (4 файла)                                            | §35                  |
| 18  | Workflows и BPMN, Exception Flows               | `docs/05-business-processes/workflows/*.md` (6 файлов), `exception-flows/shipment-exceptions.md` | §34                  |

---

## Этап 6 — Маркетплейс

| #   | Промпт                                   | Создаваемые файлы                                                                                                         | Секции master-prompt |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 19  | Load/Truck Marketplace, Private, Tenders | `docs/06-marketplace/load-marketplace.md`, `truck-marketplace.md`, `private-marketplaces.md`, `tendering.md`              | §7                   |
| 20  | Search, Matching, Ranking, Negotiation   | `docs/06-marketplace/search.md`, `matching.md`, `ranking.md`, `recommendations.md`, `counter-offers.md`, `negotiation.md` | §8, §9               |

---

## Этап 7 — Transport Execution

| #   | Промпт                                     | Создаваемые файлы                                                                                                         | Секции master-prompt |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 21  | Transport Order, Assignment, Statuses, PoD | `docs/07-transport-execution/transport-order.md`, `assignment.md`, `statuses.md`, `exceptions.md`, `proof-of-delivery.md` | §12, §13             |
| 22  | Pickup, Transit, Delivery, Tracking        | `docs/07-transport-execution/pickup.md`, `transit.md`, `delivery.md`, `tracking.md`                                       | §12                  |

---

## Этап 8 — Companies, Fleet, Location

| #   | Промпт                                                  | Создаваемые файлы                              | Секции master-prompt |
| --- | ------------------------------------------------------- | ---------------------------------------------- | -------------------- |
| 23  | Companies & Trust (профиль, верификация, рейтинг, risk) | `docs/08-companies-and-trust/*.md` (7 файлов)  | §14                  |
| 24  | Fleet Management                                        | `docs/09-fleet/*.md` (6 файлов)                | —                    |
| 25  | Location, Geocoding, Routing, GPS Ingestion             | `docs/10-location-and-routing/*.md` (7 файлов) | §10, §11             |

---

## Этап 9 — Documents, Finance, Communication

| #   | Промпт                                             | Создаваемые файлы                       | Секции master-prompt |
| --- | -------------------------------------------------- | --------------------------------------- | -------------------- |
| 26  | Документооборот (типы, eCMR, подписи, lifecycle)   | `docs/11-documents/*.md` (6 файлов)     | §23                  |
| 27  | Finance (pricing, invoices, payments, guarantees)  | `docs/12-finance/*.md` (8 файлов)       | §22                  |
| 28  | Communication (messenger, notifications, realtime) | `docs/13-communication/*.md` (6 файлов) | §24, §25             |

---

## Этап 10 — API и Интеграции

| #   | Промпт                                                   | Создаваемые файлы                                                                                                                                           | Секции master-prompt |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 29  | API Guidelines (auth, versioning, idempotency, errors)   | `docs/14-api/api-guidelines.md`, `authentication.md`, `authorization.md`, `versioning.md`, `idempotency.md`, `pagination.md`, `errors.md`, `rate-limits.md` | §17                  |
| 30  | OpenAPI спецификации (loads, offers, orders, shipments…) | `docs/14-api/openapi/*.yaml` (8 файлов)                                                                                                                     | §17                  |
| 31  | AsyncAPI, Webhooks                                       | `docs/14-api/asyncapi/events.yaml`, `docs/14-api/openapi/webhooks.yaml`                                                                                     | §18                  |
| 32  | Интеграции (TMS, ERP, GPS, Maps, Payments…)              | `docs/16-integrations/*/integration-guide.md` (7 файлов)                                                                                                    | §18                  |

---

## Этап 11 — Data Architecture

| #   | Промпт                                                        | Создаваемые файлы                                                                                | Секции master-prompt |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| 33  | Data Model, Ownership, Consistency, Full ERD                  | `docs/15-data/data-model.md`, `ownership.md`, `consistency.md`, `erd/full-erd.md`                | §19, §20             |
| 34  | Concurrency, Replication, Retention, Migrations, Search Index | `docs/15-data/replication.md`, `retention.md`, `archival.md`, `migrations.md`, `search-index.md` | §20, §21             |

---

## Этап 12 — Security, Observability, Operations

| #   | Промпт                                                        | Создаваемые файлы                                      | Секции master-prompt |
| --- | ------------------------------------------------------------- | ------------------------------------------------------ | -------------------- |
| 35  | Security (threat model, auth, tenant isolation, audit, abuse) | `docs/17-security/*.md` (9 файлов)                     | §26                  |
| 36  | Observability (logging, metrics, tracing, SLO)                | `docs/18-observability/*.md` (6 файлов)                | §27                  |
| 37  | Operations (deployment, CI/CD, DR, runbooks)                  | `docs/19-operations/*.md` + `runbooks/*.md` (9 файлов) | §30, §31             |

---

## Этап 13 — UI и Testing

| #   | Промпт                                                           | Создаваемые файлы                                                                                | Секции master-prompt |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| 38  | UI Behavior Contracts, Realtime UI, Permissions                  | `docs/20-ui/screen-contracts/*.md`, `realtime-ui.md`, `permissions/ui-permissions.md` (7 файлов) | §35                  |
| 39  | Testing Strategy (unit, integration, contract, e2e, load, chaos) | `docs/21-testing/*.md` (8 файлов)                                                                | §32                  |

---

## Сводка

| Метрика                   | Значение |
| ------------------------- | -------- |
| Всего промптов            | 39       |
| Всего файлов документации | ~200     |
| Всего этапов              | 13       |

---

## Порядок выполнения

```text
Этап 1  ─→  Этап 2  ─→  Этап 3  ─→  Этап 4  ─→  Этап 5
                                                      │
                                          ┌───────────┼───────────┐
                                          ▼           ▼           ▼
                                       Этап 6     Этап 7     Этап 8
                                          │           │           │
                                          └───────────┼───────────┘
                                                      ▼
                                                   Этап 9
                                                      │
                                                      ▼
                                                  Этап 10
                                                      │
                                                      ▼
                                                  Этап 11
                                                      │
                                                      ▼
                                                  Этап 12
                                                      │
                                                      ▼
                                                  Этап 13
```

> Этапы 6, 7, 8 можно выполнять параллельно после Этапа 5.
