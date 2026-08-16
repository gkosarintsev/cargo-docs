# Контрактное тестирование (Contract Testing)

## 1. Consumer-Driven Contract Testing для REST API (Pact)
Контрактное тестирование защищает мобильные приложения водителей и интеграции TMS от неожиданных изменений REST API.
- Клиент (SPA/TMS/Mobile) формирует контракт (ожидаемые запросы и структура ответов).
- Бэкенд (Провайдер) верифицирует себя против контрактов всех потребителей на этапе CI.

```typescript
// Пример Pact-теста на стороне клиента:
provider.addInteraction({
  state: "A load with ID 123 exists",
  uponReceiving: "A request for load details",
  withRequest: { method: "GET", path: "/api/v1/loads/123" },
  willRespondWith: { status: 200, body: { id: "123", status: "PUBLISHED" } }
});
```

## 2. Контракты асинхронных сообщений Kafka
Используется **Schema Registry** (Protobuf / JSON Schema).
- **Политика эволюции схем**: `BACKWARD_TRANSITIVE`. Новые консьюмеры всегда могут читать старые события; старые консьюмеры не падают при добавлении новых полей.
- Проверки схем встраиваются в CI-пайплайн перед коммитом.

## 3. Тестирование исходящих вебхуков
Mock-сервер эмулирует клиентские TMS системы. В нем задаются сценарии 500 ошибок и задержек (> 10s) для проверки надежности Retry-политик и правильности перевода сообщений в DLQ (Dead Letter Queue).
