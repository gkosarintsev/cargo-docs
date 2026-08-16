# Поведенческий контракт: Экран торга и работы с откликами

## Поведенческие контракты

```text
Screen: Offer Card
  ↓
User Action: Клик "Встречное предложение" -> ввод ставки 100k -> Submit
  ↓
Client Validation: Ставка < текущей (для грузовладельца)
  ↓
API Request: POST /api/v1/offers/{id}/counter
  ↓
Server State: Обновление оффера, статус -> COUNTERED
  ↓
UI State Reconciliation: Мгновенный перевод карточки в статус "Ожидает ответа перевозчика"

Screen: Offer Card
  ↓
User Action: Клик "Принять предложение" -> Подтверждение в модале
  ↓
API Request: POST /api/v1/offers/{id}/accept
  ↓
Server State: Бронирование груза, отклонение других офферов, создание TransportOrder
  ↓
Realtime Event: WS broadcast на другие сессии
  ↓
UI State Reconciliation: Переход в мастер оформления TransportOrder, блокировка других офферов в списке.
```
