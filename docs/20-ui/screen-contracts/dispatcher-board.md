# Поведенческий контракт: Диспетчерский пульт (Active Fleet Board)

## Поведенческие контракты

```text
Screen: Split-view Board
  ↓
Server State: Приход GPS точки от трекера
  ↓
Realtime Event: WS push "gps_position_updated"
  ↓
UI State Reconciliation: Плавное перемещение (интерполяция) маркера фуры на интерактивной карте.

Screen: Active Alert
  ↓
User Action: Клик по алерту "Поломка в пути"
  ↓
Client Validation: -
  ↓
UI State Reconciliation: Центрирование карты на координатах машины, раскрытие панели экстренной связи и кнопки "Назначить резервный тягач".
```
