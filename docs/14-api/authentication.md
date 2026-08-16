# Аутентификация (Authentication)

> **Раздел:** 14-api  
> **Версия документа:** 1.0  
> **Статус:** Действующий стандарт  
> **Связанные документы:** [authorization.md](authorization.md), [api-guidelines.md](api-guidelines.md)

---

## 1. Обзор схем аутентификации

Платформа CargoPlus поддерживает две схемы аутентификации:

| Схема           | Заголовок                     | Применение                                              |
| --------------- | ----------------------------- | ------------------------------------------------------- |
| **User JWT**    | `Authorization: Bearer <JWT>` | Веб-приложение, мобильные клиенты, интерактивные сессии |
| **B2B API Key** | `X-API-Key: carg_live_...`    | Машинные интеграции (TMS, ERP, внешние системы)         |

Все защищённые эндпоинты требуют наличия одного из этих заголовков. При отсутствии заголовка — ответ `401 Unauthorized`.

---

## 2. User JWT Flow (Схема аутентификации пользователя)

### 2.1 Передача токена

Токен передаётся в заголовке каждого запроса:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Схема: `Bearer` (RFC 6750).
- Алгоритм подписи: `RS256` (RSA + SHA-256). Симметричные алгоритмы (`HS256`) запрещены.
- Ключи подписи: ротируются каждые 30 дней через JWKS-эндпоинт (`/.well-known/jwks.json`).

### 2.2 Структура Access Token (Claims)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-2024-03"
  },
  "payload": {
    "sub": "usr_550e8400-e29b-41d4-a716-446655440000",
    "org_id": "org_123e4567-e89b-12d3-a456-426614174000",
    "role": "Dispatcher",
    "permissions": ["loads:read", "loads:write", "orders:manage"],
    "email": "dispatcher@example.com",
    "exp": 1710500400,
    "iat": 1710496800,
    "nbf": 1710496800,
    "jti": "tok_a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "iss": "https://auth.cargo.platform",
    "aud": ["https://api.cargo.platform"]
  }
}
```

**Описание Claims:**

| Claim         | Тип      | Описание                                                                    |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `sub`         | string   | Уникальный идентификатор пользователя (префикс `usr_`)                      |
| `org_id`      | string   | Идентификатор организации пользователя (префикс `org_`)                     |
| `role`        | string   | Роль в организации: `Owner`, `Dispatcher`, `Accountant`, `Driver`, `Viewer` |
| `permissions` | string[] | Список явно назначенных разрешений (скоупов)                                |
| `email`       | string   | Email пользователя (только для логирования)                                 |
| `exp`         | number   | Unix timestamp истечения токена (Access Token: TTL = 15 минут)              |
| `iat`         | number   | Unix timestamp выпуска токена                                               |
| `nbf`         | number   | Unix timestamp начала действия токена                                       |
| `jti`         | string   | Уникальный ID токена (для blacklist при logout)                             |
| `iss`         | string   | Издатель токена (Auth Service URL)                                          |
| `aud`         | string[] | Целевые получатели токена                                                   |

### 2.3 Время жизни токенов

| Тип токена    | TTL      | Хранение на клиенте      |
| ------------- | -------- | ------------------------ |
| Access Token  | 15 минут | Память (не localStorage) |
| Refresh Token | 30 дней  | HttpOnly Secure Cookie   |

### 2.4 Схема Refresh Token Rotation

Механизм защиты от перехвата Refresh Token:

```
Клиент                        Auth Service
  |                                |
  |-- POST /auth/refresh ---------->|
  |   { refresh_token: "rt_abc" }  |
  |                                |-- Валидация rt_abc
  |                                |-- Инвалидация rt_abc в базе
  |                                |-- Генерация новой пары токенов
  |<-- 200 OK --------------------|
  |   {                           |
  |     access_token: "new_at",   |
  |     refresh_token: "rt_xyz",  |
  |     expires_in: 900           |
  |   }                           |
```

**Правила ротации:**

1. При каждом успешном обновлении старый Refresh Token немедленно инвалидируется в базе данных.
2. Новая пара токенов (Access + Refresh) возвращается в ответе.
3. **Обнаружение атаки повторного использования:** если клиент предъявляет уже инвалидированный Refresh Token — все Refresh Token данного пользователя немедленно отзываются, сессия принудительно завершается.
4. Refresh Token хранится в HttpOnly Secure SameSite=Strict Cookie.
5. Передача Refresh Token через URL или тело запроса вне формы авторизации — запрещена.

### 2.5 Logout и Blacklisting

- При выходе пользователя: `jti` текущего Access Token заносится в Redis-blacklist (TTL = оставшееся время жизни токена).
- Все API Gateway перед обработкой запроса проверяют `jti` по Redis.
- При компрометации: администратор может отозвать все токены пользователя через Admin API.

---

## 3. B2B API Key Flow (Схема интеграции)

### 3.1 Передача ключа

```
X-API-Key: carg_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

- Ключи создаются через раздел «Интеграции» личного кабинета организации.
- Один аккаунт организации может иметь до 10 активных API Key одновременно.
- Ключ ассоциирован с организацией и набором разрешённых скоупов.

### 3.2 Форматы ключей

| Тип среды  | Префикс         | Пример                   |
| ---------- | --------------- | ------------------------ |
| Production | `carg_live_sk_` | `carg_live_sk_a1b2c3...` |
| Sandbox    | `carg_test_sk_` | `carg_test_sk_x9y8z7...` |

Ключи sandbox не принимаются в production среде, и наоборот.

### 3.3 Атрибуты API Key

```json
{
  "key_id": "key_abc123",
  "name": "ERP Integration - Production",
  "organization_id": "org_123e4567-e89b-12d3-a456-426614174000",
  "scopes": ["loads:read", "orders:manage", "telemetry:ingest"],
  "created_at": "2024-01-15T10:00:00Z",
  "last_used_at": "2024-03-15T09:45:00Z",
  "expires_at": "2025-01-15T10:00:00Z",
  "ip_allowlist": ["185.12.34.0/24", "10.0.0.1"]
}
```

### 3.4 Ограничения API Key

- API Key не поддерживает смену пароля или двухфакторную аутентификацию — достаточно знания ключа.
- API Key не предоставляет доступ к административным функциям платформы.
- Рекомендуется настраивать `ip_allowlist` для ограничения источников запросов.
- Все запросы с API Key логируются с `key_id` для аудита.

---

## 4. Общие требования безопасности

### 4.1 Передача данных

- Все API работают исключительно по HTTPS/TLS 1.2+.
- HTTP-запросы перенаправляются на HTTPS (301 Redirect) или отклоняются.

### 4.2 Обработка ошибок аутентификации

```json
// 401 Unauthorized — отсутствует заголовок аутентификации
{
  "type": "https://api.cargo.platform/errors/missing-authentication",
  "title": "Требуется аутентификация",
  "status": 401,
  "detail": "Заголовок Authorization или X-API-Key отсутствует в запросе",
  "error_code": "MISSING_AUTHENTICATION"
}

// 401 Unauthorized — токен истёк
{
  "type": "https://api.cargo.platform/errors/token-expired",
  "title": "Токен истёк",
  "status": 401,
  "detail": "Access Token истёк. Обновите токен через /auth/refresh",
  "error_code": "TOKEN_EXPIRED"
}
```

### 4.3 Защита от брутфорса

- После 5 неудачных попыток аутентификации с одного IP — блокировка на 15 минут.
- Счётчик неудачных попыток хранится в Redis с TTL 15 минут.
