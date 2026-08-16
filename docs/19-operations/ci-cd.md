# CI/CD Пайплайны

## Пайплайн GitLab CI / GitHub Actions
1. **Code Quality & Lint**: `eslint`, `golangci-lint`, `ruff`.
2. **Unit Tests**: Прогон юнит-тестов (покрытие > 80%).
3. **Build & Scan**: 
   - Сборка Docker образа.
   - Сканирование на уязвимости с помощью **Trivy**. Блокировка пайплайна при наличии `Critical` или `High` CVE.
4. **Integration / Contract Tests**: Поднятие Testcontainers, проверка API контрактов.
5. **Deploy to Staging**: ArgoCD синхронизирует image tag в ветке staging.
6. **Automated E2E**: Прогон Playwright / Cypress тестов.
7. **Canary Deploy to Prod**: Частичный релиз через Argo Rollouts.
8. **Healthcheck & Full Rollout**: Мониторинг 15 минут. Если 5xx = 0, полный релиз.
