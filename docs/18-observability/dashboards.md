# Спецификация дашбордов Grafana

## 1. Executive Overview (Бизнес-дашборд)
- GMV (Gross Merchandise Volume).
- Количество активных рейсов (Gauge).
- DAU (Daily Active Users).
- Общая доступность платформы (SLA Uptime).

## 2. Marketplace & Search Board
- RPS поиска.
- Конверсия офферов (Offers Submitted -> Accepted).
- Топ популярных маршрутов и регионов.

## 3. Telematics & Fleet Health
- Входящий поток GPS точек/сек (Ingestion Rate).
- Лаг процессора точек (Processing Lag).
- Статус нод Ingestion Gateway и Kafka топиков.

## 4. Infrastructure Board
- CPU / RAM подов Kubernetes.
- Состояние дисков и PV/PVC.
- Репликация PostgreSQL (Replication Lag в мс).
- Использование памяти Redis.
