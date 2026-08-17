# Архитектура поискового индекса OpenSearch

## Пайплайн индексации и синхронизации
`PostgreSQL (Transactional Outbox) → Kafka topic: marketplace.loads.v1 → OpenSearch Ingestion Worker (Batch Bulk Indexing) → OpenSearch Cluster`

## Топология кластера OpenSearch
- 3 Master-eligible nodes
- 3 Data nodes
- 2 Ingest/Coordinating nodes
- Конфигурация индексов: 5 Primary Shards + 1 Replica Shard.

## Обработка частичных обновлений и удалений
- **Partial Updates**: обновление отдельных полей (например, цены или количества офферов) без полной перезаписи документа.
- **Мягкое удаление**: маркировка `is_active: false` с последующим периодическим `delete_by_query`.

## Стратегия переиндексации без простоя (Zero-downtime Reindexing)
- Использование индексов-алиасов (`loads_current` → `loads_v1`).
- Пайплайн миграции: 
  1. Создание `loads_v2` с новым маппингом.
  2. Запуск `Reindex API`.
  3. Прогрев нового индекса.
  4. Атомарный переброс алиаса `loads_current` на `loads_v2`.
  5. Удаление старого `loads_v1`.
