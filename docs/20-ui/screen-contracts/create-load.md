# Поведенческий контракт: Экран публикации груза

## Состояния экрана
`Initial Form`, `Validating Addresses`, `Calculating Recommended Price`, `Publishing`, `Published Success`

## Поведенческие контракты

```text
Screen: Initial Form -> Address Input
  ↓
User Action: Ввод "Москва, Ленина 1"
  ↓
Client Validation: Дебаунс 300мс
  ↓
API Request: GET /api/v1/maps/geocode?q=...
  ↓
UI State Reconciliation: Автокомплит, выбор адреса, отрисовка точки на карте.

Screen: Form with Payload specs
  ↓
User Action: Изменение веса (20т) и типа кузова (Тент)
  ↓
API Request: GET /api/v1/pricing/estimate
  ↓
UI State Reconciliation: Показ виджета "Рекомендуемая ставка: 110 000 – 125 000 ₽"

Screen: Validated Form
  ↓
User Action: Клик "Опубликовать"
  ↓
Client Validation: Проверка обязательных полей, блокировка кнопки, генерация Idempotency-Key
  ↓
API Request: POST /api/v1/loads (Headers: Idempotency-Key)
  ↓
Server State: Транзакция создания груза -> Event: LoadPublished
  ↓
UI State Reconciliation: Оптимистичный показ груза в списке ("Синхронизация...") -> редирект в карточку груза.
```
