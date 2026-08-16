# Поведенческий контракт: Главный дашборд грузовладельца

## Состояния экрана
`Loading Data`, `Dashboard Active`, `Error State (Retry)`

## Поведенческие контракты

```text
Screen: Dashboard Active
  ↓
User Action: Автоматическая подгрузка данных при входе
  ↓
Client Validation: -
  ↓
API Request: GET /api/v1/dashboard/shipper/kpi
  ↓
Server State: Формирование метрик из Read-Model
  ↓
UI State Reconciliation: Отрисовка KPI виджетов (Активные грузы, в пути, ожидают оплаты).

Screen: Dashboard Active
  ↓
User Action: Клик по кнопке "Создать груз"
  ↓
UI State Reconciliation: Переход на роут /loads/create.
```
