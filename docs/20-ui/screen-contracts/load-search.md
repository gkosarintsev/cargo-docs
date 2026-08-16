# Поведенческий контракт: Экран поиска и фильтрации грузов

## Состояния экрана
`Loading Skeleton`, `Results List`, `Map View Split`, `Empty State`, `Error State`

## Поведенческие контракты

```text
Screen: Results List
  ↓
User Action: Изменение фильтров (радиус, кузов)
  ↓
Client Validation: Дебаунс 300мс, сброс курсора
  ↓
API Request: GET /api/v1/loads?radius=...
  ↓
UI State Reconciliation: Замена списка с лоадером -> Отрисовка новых грузов

Screen: Results List (Idle)
  ↓
Server State: Появился новый груз под фильтры в OpenSearch
  ↓
Realtime Event: WS push "new_load_match"
  ↓
UI State Reconciliation: Показ бейджа "+3 новых груза по вашему поиску" без сбивания скролла.
```
