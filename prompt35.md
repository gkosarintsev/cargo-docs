# Промпт 35 — Информационная безопасность и Модель угроз (Security Domain)

> **Файлы на выходе:**
>
> - `docs/17-security/threat-model.md`
> - `docs/17-security/authentication.md`
> - `docs/17-security/authorization.md`
> - `docs/17-security/tenant-isolation.md`
> - `docs/17-security/secrets.md`
> - `docs/17-security/encryption.md`
> - `docs/17-security/audit-log.md`
> - `docs/17-security/abuse-prevention.md`
> - `docs/17-security/security-events.md`

---

## Контекст

Переходим к разделу **17-security** (Этап 12).
Формируем исчерпывающую документацию по безопасности B2B логистической платформы.
Система оперирует коммерческой тайной, маршрутами дорогостоящих грузов, банковскими платежами и персональными данными водителей (из §26 master-prompt).

Язык — **русский**.

---

## Задание 1: создай `docs/17-security/threat-model.md`

### Содержимое документа (Модель угроз по методологии STRIDE)

Проведи глубокий анализ и специфицируй векторы атак, последствия и меры защиты для всех угроз из §26 master-prompt:

1. **Account Takeover (Захват аккаунта диспетчера/руководителя)**:
   - Вектор: фишинг, перебор паролей, утечка сессионных токенов.
   - Защита: обязательная 2FA (TOTP/SMS) для финансовых действий, детекция входа с аномальных IP/устройств, ротация Refresh-токенов.
2. **Fake Companies & Fake Loads / Carriers (Фиктивные фирмы и грузы-приманки)**:
   - Вектор: регистрация по поддельным документам для перехвата грузов (Freight Theft).
   - Защита: многоуровневая верификация, проверка по реестрам ФНС, видео-верификация директоров, проверка реального автопарка.
3. **Marketplace Scraping & Price Manipulation (Скрапинг базы грузов и манипуляция ставками)**:
   - Вектор: бот-фермы, скрапящие объявления конкурентов.
   - Защита: Cloudflare Bot Management, Rate Limiting, динамическая подгрузка контактов только по клику с лимитом на аккаунт.
4. **Tenant Isolation Breach / BOLA / IDOR (Утечка чужих грузов и цен)**:
   - Вектор: подмена `organization_id` или `load_id` в REST-запросах.
   - Защита: автоматизированная проверка владения объектом в middleware, RLS в БД.
5. **Malicious File Upload (Вредоносные вложения под видом накладных)**:
   - Вектор: загрузка вирусов/макросов под видом PDF/JPEG документов.
   - Защита: сканирование антивирусом (ClamAV) в S3 пайплайне, проверка MIME-типов по сигнатурам файлов, запрет исполняемых расширений.
6. **Webhook Forgery & Replay Attacks (Подделка и повтор вебхуков)**:
   - Вектор: отправка фальшивых статусов доставки от имени телематических систем.
   - Защита: HMAC-SHA256 подписи, проверка timestamp (окно 5 мин).

---

## Задание 2: создай файлы аутентификации, авторизации и изоляции

1. **`authentication.md`**:
   - Политика паролей (Argon2id, мин. 12 символов, проверка по словарям скомпрометированных паролей).
   - Жизненный цикл сессий, защита от CSRF (SameSite cookies), безопасное хранилище токенов в мобильном приложении (Android Keystore / iOS Keychain).
2. **`authorization.md`**:
   - RBAC/ABAC матрица ролей и гранулярных привилегий (`PERM_LOAD_CREATE`, `PERM_OFFER_ACCEPT`, `PERM_FINANCE_PAY`, `PERM_AUDIT_VIEW`).
3. **`tenant-isolation.md`**:
   - Архитектурные гарантии изоляции данных между организациями на уровне API Gateway, Service Layer, Database и Message Broker (Tenant Partitioning).

---

## Задание 3: создай `docs/17-security/secrets.md` и `encryption.md`

1. **`secrets.md` (Управление секретами и ключами)**:
   - Хранение секретов в HashiCorp Vault / AWS Secrets Manager / Kubernetes Secrets.
   - Автоматическая ротация API-ключей и сертификатов (Cert-Manager, Let's Encrypt).
2. **`encryption.md` (Шифрование данных)**:
   - Data-at-Rest: LUKS-шифрование дисков, AES-256 шифрование бакетов S3.
   - Data-in-Transit: TLS 1.3 с принудительным HSTS для веба, mTLS для межсервисного взаимодействия внутри кластера.

---

## Задание 4: создай `docs/17-security/audit-log.md`, `abuse-prevention.md` и `security-events.md`

1. **`audit-log.md` (Неизменяемый журнал аудита / Audit Trail)**:
   - Обязательное логирование критических действий: изменение банковских реквизитов, смена прав пользователей, экспорт списков клиентов, смена водителя на рейсе, отмена заказа.
   - Структура записи: `timestamp`, `actor_id`, `actor_org_id`, `ip_address`, `action`, `resource_type`, `resource_id`, `diff_before_after`.
   - Защита от модификации и удаления журналов (Append-only storage / WORM).
2. **`abuse-prevention.md` (Предотвращение злоупотреблений и фрода)**:
   - Поведенческий антифрод (Fraud Monitoring Engine): алерты на аномальную активность (50 созданных грузов за 1 минуту, вход из двух разных стран одновременно).
   - CAPTCHA (Cloudflare Turnstile / reCAPTCHA v3) на формах регистрации и авторизации.
3. **`security-events.md` (Каталог событий безопасности)**:
   - События: `UserLoginFailed`, `PasswordResetRequested`, `TwoFactorAuthFailed`, `SuspiciousActivityDetected`, `TenantAccessViolationAttempt`, `ApiKeyRevoked`.
   - Интеграция с SIEM / SOC системами.

---

## Важные замечания для выполнения

- Опиши реальные превентивные и компенсационные меры безопасности для B2B маркетплейсов.
- Специфицируй конкретные технические стандарты и алгоритмы шифрования.
