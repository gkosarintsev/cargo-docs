# Высоконагруженный контур приема GPS (GPS Ingestion)

## Обзор

Подсистема Ingestion отвечает за прием, валидацию и потоковую обработку телеметрических данных (GPS-координаты, скорость, события устройств) от сотен тысяч грузовиков в режиме реального времени.

## Поток данных (Data Flow)

Архитектура построена на принципах потоковой обработки (Stream Processing) с разделением на независимые слои.

```text
Driver App / Hardware GPS Tracker
        ↓ (HTTPS / TCP / MQTT)
Stateless Ingestion Gateway (Go/Rust)
        ↓ (Kafka topic: telemetry.raw)
Stream Processor (Flink / Go Workers)
   ├── Validation & Deduplication (out-of-order check)
   ├── Geofence Engine (вход/выход из складов)
   ├── Redis (Current Position: GEOADD)
   └── TimescaleDB / ClickHouse (Track History)
        ↓
WebSocket / SSE Gateway
        ↓
Dispatcher Web UI / Public Tracking Link
```

1. **Ingestion Gateway**: Легковесные, stateless edge-серверы, написанные на Go или Rust для минимального потребления памяти при удержании десятков тысяч открытых TCP/MQTT соединений. Их единственная задача — принять пакет, добавить `Server Ingestion Timestamp` и отправить в Kafka.
2. **Kafka**: Выступает в роли надежного буфера (topic `telemetry.raw`), гарантируя, что пиковые нагрузки (например, массовый выход машин на связь после потери сети) не положат базы данных.
3. **Stream Processor**: Кластер воркеров (Apache Flink или микросервисы на Go), читающих из Kafka, нормализующих данные и распределяющих их по хранилищам.

## Решение ключевых проблем телематики

1. **Нестабильная мобильная связь и оффлайн-буферизация (Offline-First Sync)**:
   - Грузовики часто едут по федеральным трассам вне зоны покрытия GSM/LTE (глухие участки до 300 км).
   - Мобильное приложение водителя использует встроенную локальную базу данных SQLite / Room / CoreData для надежного буферизованного хранения.

### Схема локальной SQLite таблицы на устройстве водителя:
```sql
CREATE TABLE offline_telemetry_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed_kmh REAL NOT NULL,
    bearing REAL NOT NULL,
    altitude REAL,
    battery_level INTEGER,
    is_charging INTEGER,
    recorded_at TEXT NOT NULL, -- ISO-8601 UTC
    sync_status TEXT DEFAULT 'PENDING', -- PENDING, IN_FLIGHT, SYNCED, FAILED
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_telemetry_pending ON offline_telemetry_queue(sync_status, id);
```

### Протокол пакетной досылки при восстановлении связи:
1. **Network Connectivity Monitor**: Сервис отслеживает состояние сети через `ConnectivityManager` (Android) / `NWPathMonitor` (iOS).
2. **Сбор пакета (Batch Chunking)**:
   - Максимальный размер пачки: **200 точек** (или не более 64 КБ полезной нагрузки).
   - Применяется компрессия gzip / zstd для минимизации трафика водителя.
3. **HTTP Эндпоинт пакетной загрузки**:
   - `POST /api/v1/telemetry/batch`
   - Заголовок `X-Device-Id: dev_mobile_pixel7_01`
   - Заголовок `X-Batch-Id: btc_91a82f14-e0b4-4e20-bf12-921839019283` (Детерминированный хэш)
4. **Структура запроса**:
```json
{
  "batch_id": "btc_91a82f14-e0b4-4e20-bf12-921839019283",
  "vehicle_id": "00000000-0000-0000-0004-000000000001",
  "trip_id": "00000000-0000-0000-0006-000000000001",
  "client_sent_at": "2024-03-20T14:30:00Z",
  "points": [
    {
      "seq": 1001,
      "lat": 56.4182,
      "lng": 38.1294,
      "speed": 78.4,
      "bearing": 142.0,
      "recorded_at": "2024-03-20T12:00:15Z"
    },
    {
      "seq": 1002,
      "lat": 56.4210,
      "lng": 38.1321,
      "speed": 81.0,
      "bearing": 143.5,
      "recorded_at": "2024-03-20T12:00:30Z"
    }
  ]
}
```
5. **Идемпотентная обработка на бэкенде**:
   - Бэкенд выполняет `INSERT ... ON CONFLICT (vehicle_id, recorded_at) DO NOTHING`.
   - В ответ возвращается: `{"status": "OK", "ingested_points": 200, "duplicates_ignored": 0}`.
6. **Очистка локального хранилища**:
   - После получения HTTP 200 записи в SQLite помечаются статусом `SYNCED`.
   - Фоновый воркер очищает записи старше 48 часов для экономии flash-памяти смартфона.

2. **Разница времени (Device Clock Drift vs Server Ingestion Timestamp)**:
   - Времени на устройстве нельзя полностью доверять (оно может сбиться).
   - Сохраняются оба времени: `device_time` (время фиксации координаты GPS модулем) и `server_time` (время получения сервером).
   - Обработка и сортировка трека строится по `device_time`, но `server_time` используется для отладки.
3. **Отсечение "выбросов" (GPS Spikes / Jumps)**:
   - GPS-модуль может дать сбой и "прыгнуть" на 10 км за секунду.
   - Stream Processor содержит фильтр Калмана или простую эвристику по скорости: если расчетная скорость между предыдущей и текущей точкой превышает физически возможную для грузовика ($V > 140$ км/ч), точка помечается как `is_valid = false` и игнорируется в расчетах ETA, но сохраняется в лог.
4. **Нарушенный порядок пакетов (Out-of-order events)**:
   - Из-за ретраев и многопоточности пакеты могут приходить не по порядку.
   - Используется монотонно возрастающий `sequence_id` или строгая сортировка по `device_time` в рамках окна агрегации (Tumbling Window) перед обработкой (например, перед фиксацией события въезда в зону).
