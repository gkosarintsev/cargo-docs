# Интеграционное тестирование

## Testcontainers
Интеграционные тесты проверяют репозитории и слой инфраструктуры на реальных сервисах.
Используются docker-контейнеры: PostgreSQL, Kafka, Redis, OpenSearch, MinIO.

## Тестирование Transactional Outbox
1. Тест выполняет бизнес-транзакцию.
2. Проверяет наличие записи в таблице `outbox_events`.
3. Запускает Outbox Worker и убеждается, что Kafka Consumer получил сообщение, а запись в `outbox_events` была удалена.

## Тестирование конкурентных блокировок
Эмуляция состояния гонки (Race Condition).
```go
// Тест одновременного принятия оффера 10 потоками
func TestConcurrentOfferAcceptance(t *testing.T) {
    // 10 goroutines вызывают AcceptOffer() для одного load_id.
    // Только 1 должна завершиться успешно, остальные 9 должны получить ConflictError.
}
```
