# Матрица владения данными (Data Ownership)

## Принцип единого хозяина данных (Single Writer Principle)
- Каждая таблица имеет ровно один Bounded Context, который является её владельцем (Source of Truth).
- Изменения выполняются ТОЛЬКО через публичный API или обработчик команд соответствующего контекста.
- Прямая запись (Direct SQL UPDATE/INSERT) в таблицы чужого контекста строго запрещена.

## Матрица владения данными (CRUD Matrix)

| Сущность/Таблица | Владелец (Write Authority) | Читатели (Read Access via API/Events) | Реплицируемые проекции (Read Models / Caches) |
|-----------------|----------------------------|---------------------------------------|-----------------------------------------------|
| `users` | IAM | Все контексты | Caching Redis (Auth) |
| `loads` | Marketplace | Transport, Negotiation | OpenSearch Index (loads) |
| `offers` | Negotiation | Marketplace, Transport | Redis Cache |
| `shipments` | Transport | Marketplace, Finance | Dashboard Read Models |
