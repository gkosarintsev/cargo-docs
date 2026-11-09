# Миграции схем БД, Zero-Downtime паттерны и Решение конкурентных коллизий

## 1. Принципы Zero-Downtime Database Migrations

При непрерывной работе платформы в режиме 24/7/365 с тысячами транзакций в минуту любые блокировки таблиц типа `ACCESS EXCLUSIVE` (например, при обычном `ALTER TABLE` или `CREATE INDEX`) приводят к каскадному накоплению очереди подключений к пулу и падению сервисов (connection starvation).

### 1.1 Правило обязательного таймаута на захват блокировки
Каждый скрипт миграции обязан начинаться с установки жесткого `lock_timeout`:

```sql
-- Если блокировка таблицы не может быть получена за 2 секунды, транзакция прерывается,
-- не блокируя остальные пользовательские запросы.
SET lock_timeout = '2s';
SET statement_timeout = '30s';
```

---

### 1.2 Паттерн Expand / Contract (Фазовое изменение схемы)

При любых изменениях полей (переименование, изменение типа, деление столбца):

| Фаза | Действие на БД | Поведение сервисов |
| :--- | :--- | :--- |
| **1. Expand** | Добавление нового столбца (`nullable`) | Старая версия приложения продолжает работать с прежним столбцом |
| **2. Dual Write** | Настройка триггера синхронизации или деплой версии с двойной записью | Новые записи пишутся в оба столбца одновременно |
| **3. Backfill** | Пакетное обновление исторических строк чанками (по 5 000 строк) | Заполнение старых записей без длительных блокировок |
| **4. Switch Read** | Переключение чтения на новый столбец | Все сервисы обращаются к новому полю |
| **5. Contract** | Удаление старого столбца / триггера | Завершение миграции схемы |

---

### 1.3 Безопасное создание индексов на высоконагруженных таблицах

Категорически запрещено создавать индексы обычной командой `CREATE INDEX`.

```sql
-- ПРАВИЛЬНО: не блокирует чтение и запись
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loads_status_geo 
ON loads (status, tenant_id);

-- В случае прерывания процесса индекс может перейти в статус INVALID:
-- Мониторинг невалидных индексов:
SELECT relname, indrelid::regclass, indisvalid 
FROM pg_index JOIN pg_class ON pg_class.oid = indexrelid 
WHERE NOT indisvalid;

-- Исправление инвалидного индекса:
DROP INDEX CONCURRENTLY IF EXISTS idx_loads_status_geo;
-- Повторное создание...
```

---

### 1.4 Пакетное обновление данных (Batch Backfilling)

При необходимости обновить миллионы строк в `telemetry_pings` или `transport_orders` используется порционное обновление через курсор или диапазон ID:

```sql
DO $$
DECLARE
    r RECORD;
    batch_size CONSTANT INT := 5000;
    rows_updated INT := 0;
BEGIN
    LOOP
        UPDATE loads 
        SET currency = 'RUB' 
        WHERE id IN (
            SELECT id FROM loads 
            WHERE currency IS NULL 
            LIMIT batch_size 
            FOR UPDATE SKIP LOCKED
        );
        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        EXIT WHEN rows_updated = 0;
        
        COMMIT; -- Освобождаем блокировки строк
        PERFORM pg_sleep(0.05); -- Даем паузу репликации
    END LOOP;
END $$;
```

---

## 2. Разрешение конкурентных конфликтов

### Сценарий 1: Два перевозчика одновременно принимают один груз
**Решение:** Optimistic Concurrency Control (OCC).
```sql
UPDATE loads 
SET status = 'BOOKED', version = version + 1, updated_at = clock_timestamp()
WHERE id = :load_id AND version = :expected_version AND status = 'PUBLISHED';
```
Проигравший (получивший 0 обновленных строк) возвращает клиенту HTTP `409 Conflict` со структурированным телом:
```json
{
  "code": "LOAD_ALREADY_BOOKED",
  "message": "Груз уже был забронирован другим перевозчиком"
}
```

### Сценарий 2: Диспетчер в UI и внешняя TMS через API одновременно меняют заказ
**Решение:** ETag и заголовок `If-Match: "<Version_Hash>"`. При несовпадении возвращается `412 Precondition Failed`.

### Сценарий 3: Один водитель / машина назначены на два пересекающихся рейса
**Решение:** Защита на уровне базы данных через исключающие ограничения PostGIS / Range Constraints:
```sql
ALTER TABLE driver_assignments 
ADD CONSTRAINT uq_driver_no_overlap 
EXCLUDE USING GIST (
    driver_id WITH =,
    tsrange(start_time, end_time) WITH &&
);
```
База данных на аппаратном уровне гарантирует невозможность двойного назначения, выбрасывая ошибку констрейнта.

### Сценарий 4: Пользователь повторно нажал кнопку отправки из-за сетевого таймаута
**Решение:** Использование заголовка `Idempotency-Key` (UUIDv4) в запросе. Сервер сохраняет ключи в Redis/PostgreSQL на 24 часа. При повторном запросе возвращается закэшированный ответ.

### Сценарий 5: Вебхук доставлен внешнему клиенту дважды
**Решение:** Уникальный `event_id` в теле вебхука. Клиент реализует паттерн Idempotent Receiver.

### Сценарий 6: Пакеты GPS пришли с нарушением порядка доставки (Out-of-Order Delivery)
**Решение:** Обновление последней известной точки (`Current Position`) в Redis выполняется только если метка времени нового пакета больше текущей через Lua-скрипт:
```lua
local current_ts = redis.call('HGET', KEYS[1], 'last_timestamp')
if not current_ts or tonumber(ARGV[1]) > tonumber(current_ts) then
    redis.call('HMSET', KEYS[1], 'last_timestamp', ARGV[1], 'lat', ARGV[2], 'lng', ARGV[3], 'speed', ARGV[4])
    return 1
end
return 0
```
