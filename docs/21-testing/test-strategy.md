# Сводная стратегия тестирования платформы

## 1. Пирамида тестирования (Testing Pyramid)
- **Unit Tests (70%)**: Проверка доменной логики, бизнес-инвариантов (расчет тарифов, парсинг GPS пакетов). Очень быстрый прогон (< 30 сек).
- **Integration / Component Tests (20%)**: Работа с реальными БД, брокерами и сервисами через Testcontainers (PostgreSQL, Kafka, OpenSearch).
- **Contract Tests (5%)**: Проверка совместимости REST API и событий Kafka (Pact / Schema Registry).
- **E2E / Scenario Tests (5%)**: Сквозные бизнес-цепочки через Playwright (Web) и Appium (Mobile), эмулирующие реальных пользователей.

## 2. Quality Gates в CI/CD пайплайне
- **Code Coverage**: >= 80% для доменного слоя. Пайплайн блокируется при падении метрики.
- **Security Scans**: Отсутствие критических уязвимостей (SonarQube, Trivy).
- **Contract Verification**: 100% успешное прохождение контрактных тестов до деплоя в Production.

## 3. Матрица тестирования окружений
`Dev (Unit/Int)` → `CI (Full Suite + Contracts)` → `Staging (E2E & Load)` → `Production (Canary & Synthetic Monitoring)`.
