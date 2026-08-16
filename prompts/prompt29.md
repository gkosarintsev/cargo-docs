# Промпт 29 — Стандарты и гайдлайны API (API Guidelines)

> **Файлы на выходе:**
>
> - `docs/14-api/api-guidelines.md`
> - `docs/14-api/authentication.md`
> - `docs/14-api/authorization.md`
> - `docs/14-api/versioning.md`
> - `docs/14-api/idempotency.md`
> - `docs/14-api/pagination.md`
> - `docs/14-api/errors.md`
> - `docs/14-api/rate-limits.md`

---

## Контекст

Переходим к разделу **14-api** (Этап 10).
Формируем единый, строгий свод правил проектирования REST API платформы (из §17 master-prompt).
Все эндпоинты платформы должны следовать единому стилю наименования, стандарту обработки ошибок, пагинации, версионирования, идемпотентности и безопасности.

Язык — **русский**.

---

## Задание 1: создай `docs/14-api/api-guidelines.md`

### Содержимое документа (Сводные правила проектирования REST API)

1. **Базовые соглашения**:
   - Формат обмена: `application/json; charset=utf-8`.
   - Именование URI: множественное число существительных в kebab-case (например: `/api/v1/truck-offers`, `/api/v1/transport-orders`).
   - Именование JSON полей: `snake_case` для всех запросов и ответов.
   - Использование HTTP-глаголов по назначению:
     - `GET`: безопасное чтение, без побочных эффектов.
     - `POST`: создание нового ресурса или выполнение неидемпотентного действия.
     - `PUT`: полная замена ресурса.
     - `PATCH`: частичное обновление ресурса (JSON Merge Patch / RFC 7396).
     - `DELETE`: удаление ресурса (или мягкое удаление soft-delete).
2. **Структура стандартного ответа (Response Envelope)**:
   - Единый формат успешных ответов для коллекций и одиночных сущностей.
   - Стандартные HTTP статус-коды: `200 OK`, `201 Created`, `202 Accepted` (для асинхронных операций), `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests`, `500 Internal Server Error`.

---

## Задание 2: создай `docs/14-api/authentication.md` и `authorization.md`

1. **`authentication.md` (Аутентификация)**:
   - **User JWT Flow**: Заголовок `Authorization: Bearer <JWT>`. Структура токена (Claims: `sub`, `org_id`, `role`, `permissions`, `exp`, `jti`).
   - **B2B API Key Flow**: Заголовок `X-API-Key: carg_live_...` для интеграции с внешними TMS/ERP системами.
   - Схема ротации Refresh Token и защита от перехвата (Refresh Token Rotation).
2. **`authorization.md` (Авторизация и контроль доступа)**:
   - Модель RBAC + Resource Ownership:
     - Роль пользователя внутри организации (`Owner`, `Dispatcher`, `Accountant`, `Driver`, `Viewer`).
     - Проверка владения: доступ разрешен только если `resource.organization_id == token.org_id` ИЛИ у пользователя есть глобальная роль модератора/администратора.
   - Спецификация скоупов API (`loads:read`, `loads:write`, `orders:manage`, `telemetry:ingest`).

---

## Задание 3: создай `docs/14-api/versioning.md` и `idempotency.md`

1. **`versioning.md` (Стратегия версионирования)**:
   - URL Path Versioning: `/api/v1/...`, `/api/v2/...`.
   - Правила обратной совместимости (Breaking vs Non-breaking changes): добавление новых полей в ответ не считается breaking change.
   - Регламент вывода устаревших версий из эксплуатации (Deprecation Policy: заголовок `Deprecation: @<timestamp>` и `Sunset: <date>`).
2. **`idempotency.md` (Спецификация идемпотентности)**:
   - Обязательное требование заголовка `Idempotency-Key: <UUIDv4>` для всех мутирующих запросов (`POST /loads`, `POST /offers`, `POST /payments`).
   - Поведение сервера при повторном запросе:
     - Если первый запрос еще обрабатывается: возврат `409 Conflict` или ожидание.
     - Если первый запрос успешно завершен: возврат сохраненного кэшированного ответа (`200/201`) с тем же телом и заголовком `X-Cache-Lookup: HIT`.
   - Время жизни ключа идемпотентности в Redis (TTL 24 часа).

---

## Задание 4: создай `docs/14-api/pagination.md`, `errors.md` и `rate-limits.md`

1. **`pagination.md` (Пагинация и сортировка)**:
   - **Cursor-based Pagination** (основная для маркетплейса и списков): параметры `limit=50&after=<cursor_token>&before=<cursor_token>`. Защита от пропусков записей при активной вставке новых грузов.
   - **Offset Pagination**: `page=1&per_page=20` (допустима только для статических справочников).
   - Сортировка: `sort=-created_at,price_amount` (минус — по убыванию).
2. **`errors.md` (Стандарт обработки ошибок — RFC 7807 Problem Details)**:
   - Структура ответа об ошибке:
     ```json
     {
       "type": "https://api.cargo.platform/errors/cargo-already-booked",
       "title": "Груз уже забронирован",
       "status": 409,
       "detail": "Груз с ID 123e4567-e89b-12d3-a456-426614174000 уже забронирован другим перевозчиком",
       "instance": "/api/v1/loads/123e4567.../book",
       "error_code": "LOAD_ALREADY_BOOKED",
       "trace_id": "a1b2c3d4-e5f6-7890",
       "invalid_params": []
     }
     ```
3. **`rate-limits.md` (Ограничение частоты запросов)**:
   - Алгоритм Token Bucket / Leaky Bucket в Redis.
   - Лимиты по уровням: Публичный поиск (100 req/min), Аутентифицированный пользователь (600 req/min), TMS API Integration (3000 req/min).
   - Стандартные заголовки ответа: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.

---

## Важные замечания для выполнения

- Спецификация должна быть настолько четкой, чтобы любой бэкенд-разработчик реализовал эндпоинты в едином стандарте без разнобоя.
