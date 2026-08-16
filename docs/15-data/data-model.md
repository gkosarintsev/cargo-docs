# Физическая модель данных

## Реляционная схема PostgreSQL
Структура таблиц разбита по Bounded Contexts. Каждая таблица имеет следующие системные поля:
- `id`: UUIDv4 (Primary Key)
- `organization_id`: UUID (Multi-tenancy)
- `created_at`: TIMESTAMPTZ (Not Null, Default NOW())
- `updated_at`: TIMESTAMPTZ (Not Null, Default NOW())
- `version`: INT (Optimistic locking)
- `deleted_at`: TIMESTAMPTZ (Soft delete, Nullable)

### Пример: Bounded Context "Marketplace"
Таблица `loads`:
- `origin_lon`, `origin_lat`: FLOAT (Координаты загрузки)
- `dest_lon`, `dest_lat`: FLOAT (Координаты выгрузки)
- `status`: VARCHAR(50) (Статус груза)

## Стратегия индексов (Indexing Strategy)
- B-Tree индексы для внешних ключей и частых фильтров: `CREATE INDEX idx_organization ON loads (organization_id)`.
- Составные индексы (Composite Indexes): `CREATE INDEX idx_loads_search ON loads (organization_id, status, pickup_date)`.
- Частичные индексы (Partial Indexes): `CREATE INDEX idx_active_loads ON loads (pickup_date) WHERE status = 'PUBLISHED'`.
- GiST/SP-GiST индексы с PostGIS: `CREATE INDEX idx_loads_geom ON loads USING gist (ST_SetSRID(ST_MakePoint(lon, lat), 4326))`.
- GIN индексы для полей JSONB и полнотекстового поиска.
