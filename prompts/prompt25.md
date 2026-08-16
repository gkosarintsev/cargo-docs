# Промпт 25 — Геолокация, Маршрутизация и Высоконагруженный GPS-трекинг

> **Файлы на выходе:**
>
> - `docs/10-location-and-routing/addresses.md`
> - `docs/10-location-and-routing/geocoding.md`
> - `docs/10-location-and-routing/routing.md`
> - `docs/10-location-and-routing/distance-calculation.md`
> - `docs/10-location-and-routing/geo-indexing.md`
> - `docs/10-location-and-routing/gps-ingestion.md`
> - `docs/10-location-and-routing/tracking.md`

---

## Контекст

Проектируем раздел **10-location-and-routing** (Этап 8).
Подсистема геолокации и телематики обеспечивает работу с адресами, геокодингом, расчетом грузовых маршрутов, индексированием пространства и высоконагруженным приемом GPS-треков (из §10 и §11 master-prompt).

Язык — **русский**.

---

## Задание 1: создай `docs/10-location-and-routing/addresses.md` и `geocoding.md`

1. **`addresses.md` (Адресная модель и справочники)**:
   - Иерархическая структура адреса: Страна (ISO 3166) → Регион/Область → Город/Населенный пункт → Улица → Дом/Строение → Промышленная зона / Номер склада / Ворота (Ramp/Gate).
   - Поддержка неструктурированных адресов, ориентиров («5-й км трассы М-4»), полигонов промышленных парков.
2. **`geocoding.md` (Прямое и обратное геокодирование)**:
   - Пайплайн геокодирования: Входная строка → Нормализатор → L1 In-Memory / Redis Cache (по MD5-хешу строки) → L2 Локальный геокодер (DaData / OpenStreetMap Nominatim / Yandex Maps) → Валидация координат.
   - Fallback-стратегия и Circuit Breaker при недоступности внешнего провайдера геокодинга.

---

## Задание 2: создай `docs/10-location-and-routing/routing.md` и `distance-calculation.md`

1. **`routing.md` (Маршрутизация для грузового транспорта / Truck Routing)**:
   - Специфика грузовой маршрутизации: учет ограничений по массе (12т/40т), нагрузке на ось, габаритной высоте мостов/туннелей, запретам движения грузовиков в центре городов, платным трассам (Платон, Автодор), экологическим зонам.
   - Построение маршрута (OSRM / Valhalla / Mapbox / Yandex Routing API) с возвратом геометрии (Polyline / GeoJSON) и пошаговых маневров.
2. **`distance-calculation.md` (Матрицы расстояний и расчет ETA)**:
   - Расчет матрицы расстояний ($N \times M$ Distance Matrix) для пакетного матчинга.
   - Алгоритм динамического расчета ETA:
     $$ETA = T_{now} + \frac{RemainingDistance}{V_{avg}(Traffic)} + RestTime(RTO) + BorderTime$$

---

## Задание 3: создай `docs/10-location-and-routing/geo-indexing.md`

### Содержимое документа (Сравнение гео-индексов: PostGIS vs Geohash vs H3 vs OpenSearch Geo)

Проведи глубокий сравнительный анализ (из §10 master-prompt):

- **PostGIS**: R-Tree/GiST индексы. Идеально для точных полигонов геозон складов, сложных географических пересечений (`ST_Intersects`, `ST_Contains`).
- **Uber H3 (Hexagonal Hierarchical Spatial Index)**: Идеально для динамического агрегирования плотности спроса/предложения (Heatmaps), быстрого поиска машин в радиусе $K$-колец (k-ring) без тригонометрических вычислений.
- **Geohash**: Префиксный строковый индекс (удобен для кэширования в Redis и шардирования).
- **OpenSearch `geo_point` / `geo_shape`**: BKD-деревья, оптимизированы для одновременной гео-фильтрации и фасетного поиска по атрибутам грузов.
- Итоговая матрица: Где какой механизм используется в нашей платформе и почему.

---

## Задание 4: создай `docs/10-location-and-routing/gps-ingestion.md` и `tracking.md`

1. **`gps-ingestion.md` (Высоконагруженный контур приема GPS)**:
   - Поток данных:
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
   - Решение ключевых проблем телематики:
     - Нестабильная мобильная связь и оффлайн-буферизация на устройстве.
     - Разница времени устройства (Device Clock Drift) и метки сервера (Server Ingestion Timestamp).
     - Отсечение "выбросов" координат (GPS Spikes/Jumps) по скорости ($V > 140$ км/ч).
     - Обработка нарушенного порядка пакетов (Out-of-order events) по монотонному `sequence_id` пакета.

2. **`tracking.md` (Архитектура отображения и хранения трекинга)**:
   - Разделение трех видов данных:
     - **Current State (Горячие данные)**: текущие координаты, скорость, направление, заряд батареи (Redis, TTL 24ч).
     - **Event History (Событийные данные)**: факты прохождения геозон, превышения скорости, смены статусов (PostgreSQL).
     - **Analytical Time Series (Исторический трек)**: миллионы точек за месяцы рейсов (TimescaleDB / ClickHouse с retention policy и сжатием).

---

## Важные замечания для выполнения

- Опиши архитектуру телематики с точными техническими деталями (структура пакета, форматы координат, протоколы).
- Не выбирай H3 автоматически — обоснуй гибридное использование PostGIS + H3 + Redis.
