# Промпт 30 — Спецификации OpenAPI (OpenAPI 3.1 YAML)

> **Файлы на выходе:**
>
> - `docs/14-api/openapi/loads.yaml`
> - `docs/14-api/openapi/offers.yaml`
> - `docs/14-api/openapi/orders.yaml`
> - `docs/14-api/openapi/shipments.yaml`
> - `docs/14-api/openapi/tracking.yaml`
> - `docs/14-api/openapi/organizations.yaml`
> - `docs/14-api/openapi/vehicles.yaml`
> - `docs/14-api/openapi/documents.yaml`

---

## Контекст

Формируем машиночитаемые спецификации **OpenAPI 3.1.0 (Swagger)** для ключевых REST-ресурсов логистической платформы.
Каждый файл должен быть полностью валидным YAML документом OpenAPI, содержать схемы запросов/ответов, примеры, описания ошибок, параметры фильтрации и схемы безопасности (из §17 master-prompt).

Язык описаний — **русский**. Формат — **OpenAPI 3.1 YAML**.

---

## Требования к спецификациям файлов

Каждый YAML-файл должен определять:

- `openapi: 3.1.0`
- `info`: заголовок, версия API (1.0.0), описание.
- `paths`: эндпоинты ресурса.
- `components.schemas`: схемы данных с валидационными ограничениями (`minimum`, `maximum`, `pattern`, `required`, `enum`).
- `components.securitySchemes`: `BearerAuth` (JWT) и `ApiKeyAuth` (`X-API-Key`).
- Параметры заголовков: `Idempotency-Key` (UUIDv4 для POST/PATCH), `X-Trace-Id`.

---

## Спецификация файлов OpenAPI:

### 1. `loads.yaml` (Управление грузами и поиск)

- Эндпоинты:
  - `GET /api/v1/loads` — расширенный поиск грузов (параметры: `origin_lat`, `origin_lon`, `origin_radius_km`, `dest_lat`, `dest_lon`, `dest_radius_km`, `pickup_date_from`, `pickup_date_to`, `body_types`, `min_weight`, `max_weight`, `cursor`, `limit`).
  - `POST /api/v1/loads` — публикация нового груза (со схемой маршрута, груза, цены).
  - `GET /api/v1/loads/{id}` — детальная карточка груза.
  - `PUT /api/v1/loads/{id}` — обновление данных груза.
  - `DELETE /api/v1/loads/{id}` — отзыв груза с публикации.
  - `POST /api/v1/loads/{id}/reserve` — бронирование груза.

### 2. `offers.yaml` (Офферы и встречные предложения)

- Эндпоинты:
  - `GET /api/v1/loads/{load_id}/offers` — список откликов по грузу.
  - `POST /api/v1/loads/{load_id}/offers` — подача коммерческого предложения перевозчиком.
  - `POST /api/v1/offers/{id}/counter` — подача встречного предложения грузовладельцем.
  - `POST /api/v1/offers/{id}/accept` — акцепт оффера (заключение сделки).
  - `POST /api/v1/offers/{id}/reject` — отклонение оффера.

### 3. `orders.yaml` (Транспортные заказы)

- Эндпоинты:
  - `GET /api/v1/transport-orders` — список заказов организации (фильтры по статусу, датам).
  - `GET /api/v1/transport-orders/{id}` — детальный заказ с договором-заявкой.
  - `POST /api/v1/transport-orders/{id}/sign` — электронное подписание заказа.
  - `POST /api/v1/transport-orders/{id}/cancel` — отмена заказа с фиксацией причины.

### 4. `shipments.yaml` (Исполнение перевозки)

- Эндпоинты:
  - `GET /api/v1/shipments` — список активных и архивных перевозок.
  - `GET /api/v1/shipments/{id}` — полная карточка рейса со списком остановок и статусом.
  - `POST /api/v1/shipments/{id}/assign` — назначение тягача, прицепа и водителя.
  - `POST /api/v1/shipments/{id}/status` — обновление статуса рейса водителем/диспетчером.
  - `POST /api/v1/shipments/{id}/exceptions` — регистрация нештатной ситуации (поломка, ДТП, задержка).

### 5. `tracking.yaml` (Телематика и координаты)

- Эндпоинты:
  - `POST /api/v1/telemetry/positions` — высоконагруженный пакетный прием GPS-точек от трекеров/приложения водителя.
  - `GET /api/v1/shipments/{id}/tracking/current` — текущая геопозиция и статус ТС.
  - `GET /api/v1/shipments/{id}/tracking/track` — исторический трек с временными метками для отрисовки на карте.
  - `GET /api/v1/public/tracking/{share_token}` — публичный легковесный трекинг без авторизации.

### 6. `organizations.yaml` (Профили компаний, сотрудники и верификация)

- Эндпоинты:
  - `GET /api/v1/organizations/me` — профиль текущей организации.
  - `PATCH /api/v1/organizations/me` — редактирование реквизитов.
  - `GET /api/v1/organizations/{id}/public-profile` — публичная карточка и паспорт надежности.
  - `GET /api/v1/organizations/me/users` / `POST /api/v1/organizations/me/users` — управление сотрудниками и ролями.

### 7. `vehicles.yaml` (Автопарк и водители)

- Эндпоинты:
  - `GET /api/v1/fleet/vehicles`, `POST /api/v1/fleet/vehicles`, `GET /api/v1/fleet/vehicles/{id}` — управление тягачами.
  - `GET /api/v1/fleet/trailers`, `POST /api/v1/fleet/trailers` — управление полуприцепами.
  - `GET /api/v1/fleet/drivers`, `POST /api/v1/fleet/drivers` — управление водителями.

### 8. `documents.yaml` (Документооборот и PoD)

- Эндпоинты:
  - `POST /api/v1/documents/upload` — загрузка файла документа / получение Pre-signed URL.
  - `GET /api/v1/shipments/{id}/documents` — список прикрепленных документов по рейсу.
  - `POST /api/v1/shipments/{id}/pod` — отправка подтверждения доставки (фото PoD с метаданными).
  - `POST /api/v1/documents/{id}/sign` — наложение электронной подписи.

---

## Важные замечания для выполнения

- YAML должен быть синтаксически корректным (валидируемым стандартными Swagger/OpenAPI парсерами).
- Обязательно укажи типы данных, форматы (`date-time`, `uuid`, `uri`, `float`), обязательные поля и коды ошибок для каждого эндпоинта.
