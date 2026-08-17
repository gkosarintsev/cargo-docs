# Интеграция с внешними TMS системами

## Сценарии интеграции
1. **Двусторонняя синхронизация грузов** (Экспорт потребности из TMS в маркетплейс платформы).
2. **Автоматический импорт предложений перевозчиков** и согласование ставок в интерфейсе TMS.
3. **Передача назначенных ТС и водителей** из TMS в рейс платформы.
4. **Получение текущих GPS-координат и статусов рейса** через Webhooks.

## Маппинг сущностей
- `NEW` в TMS -> `CREATED` в Платформе
- `ASSIGNED` в TMS -> `RESERVED` в Платформе

## Пример кода на Python для публикации груза
```python
import requests
import json

url = "https://api.platform.com/v1/loads"
headers = {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "origin": "Moscow",
    "destination": "SPB",
    "weight": 20.5
}
response = requests.post(url, headers=headers, json=data)
print(response.json())
```
