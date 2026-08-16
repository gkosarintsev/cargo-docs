# Промпт 31 — Асинхронные интерфейсы: AsyncAPI и Спецификация Webhooks

> **Файлы на выходе:**
>
> - `docs/14-api/asyncapi/events.yaml`
> - `docs/14-api/openapi/webhooks.yaml`

---

## Контекст

Продолжаем раздел **14-api**.
Специфицируем асинхронные протоколы обмена: спецификацию брокера сообщений **AsyncAPI 2.6 / 3.0** для внутренних и внешних топиков Kafka, а также полную спецификацию системы исходящих вебхуков (**Webhooks API**) для интеграции с TMS/ERP клиентов (из §18 master-prompt).

Язык описаний — **русский**. Форматы — **AsyncAPI YAML** и **OpenAPI 3.1 YAML (Webhooks)**.

---

## Задание 1: создай `docs/14-api/asyncapi/events.yaml`

### Содержимое файла (AsyncAPI 2.6/3.0 YAML)

1. `asyncapi: '2.6.0'`
2. `info`: Заголовок («Шина событий логистической платформы»), версия `1.0.0`, описание.
3. `servers`: кластеры Kafka (`production`, `staging`).
4. `channels` (Топики Kafka):
   - `marketplace.loads.v1`: события `LoadPublished`, `LoadUpdated`, `LoadExpired`, `LoadWithdrawn`.
   - `marketplace.offers.v1`: события `OfferSubmitted`, `OfferAccepted`, `OfferRejected`.
   - `transport.orders.v1`: события `TransportOrderCreated`, `TransportOrderSigned`, `TransportOrderCancelled`.
   - `transport.shipments.v1`: события `ShipmentStatusChanged`, `ShipmentDriverAssigned`, `ShipmentExceptionOccurred`.
   - `telemetry.gps.v1`: события `GpsBatchReceived`, `GeofenceEvent`, `RouteDeviated`.
   - `documents.edo.v1`: события `DocumentUploaded`, `DocumentSigned`, `PodSubmitted`.
   - `billing.invoices.v1`: события `InvoiceIssued`, `PaymentCaptured`.
5. `components.messages`: схемы сообщений в формате JSON Schema с полями `event_id`, `aggregate_id`, `timestamp`, `producer`, `trace_id`, `payload`.
6. `components.bindings.kafka`: параметры ключа партиционирования (`key: { type: "string" }`) для каждого топика.

---

## Задание 2: создай `docs/14-api/openapi/webhooks.yaml`

### Содержимое файла (Спецификация исходящих Webhooks и управления подписками)

1. **Модель подписки на вебхуки (Webhook Subscription API)**:
   - `POST /api/v1/webhooks/subscriptions` — регистрация нового вебхука (URL получателя, список подписываемых событий, секретный ключ для проверки подписи `secret`).
   - `GET /api/v1/webhooks/subscriptions` — список активных подписок компании.
   - `DELETE /api/v1/webhooks/subscriptions/{id}` — удаление подписки.
   - `POST /api/v1/webhooks/subscriptions/{id}/test` — отправка тестового пинг-события.
   - `GET /api/v1/webhooks/deliveries` — журнал попыток доставки вебхуков (статус, HTTP код ответа клиента, тело ответа, задержка).

2. **Спецификация исходящих вебхук-уведомлений (Webhooks Section)**:
   - В секции `webhooks:` OpenAPI 3.1 специфицируй типы событий, отправляемых на сервер клиента:
     - `load.status_changed`: уведомление об изменении статуса груза (бронь, отмена).
     - `offer.received`: уведомление грузовладельцу о поступлении нового отклика.
     - `order.created`: уведомление в TMS перевозчика о заключении договора-заявки.
     - `shipment.status_updated`: уведомление о прохождении контрольных точек (погрузка, транзит, выгрузка).
     - `shipment.eta_updated`: уведомление об изменении расчетного времени прибытия.
     - `document.signed`: уведомление о подписании накладной или поступлении PoD.

3. **Спецификация безопасности и надежности доставки вебхуков**:
   - Заголовок подписи: `X-Cargo-Signature: t=1692187200,v1=52571869e7900...` (HMAC-SHA256 от `timestamp.payload`).
   - Защита от Replay атак: отклонение запросов с разницей во времени более 5 минут.
   - Политика повторных попыток (Retry Policy): 8 попыток с экспоненциальным backoff (0s, 15s, 1m, 5m, 15m, 1h, 6h, 24h). При постоянных ошибках (5xx, таймаут > 10 сек) отправка в DLQ и временная приостановка подписки с оповещением администратора интеграции.

---

## Важные замечания для выполнения

- Оба файла должны быть синтаксически корректными YAML спецификациями.
- Приведи реалистичные и детальные примеры полезной нагрузки (JSON payload) для каждого вебхука.
