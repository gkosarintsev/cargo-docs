# Каталог событий безопасности

Все инциденты безопасности транслируются в специализированный топик Kafka и интегрируются с SIEM / SOC системами организации для оперативного реагирования.

- `UserLoginFailed`: 5 неудачных попыток входа (ведет к Rate Limit).
- `PasswordResetRequested`: Инициирован сброс пароля.
- `TwoFactorAuthFailed`: Неудачный ввод OTP кода.
- `SuspiciousActivityDetected`: Срабатывание триггеров антифрод-движка.
- `TenantAccessViolationAttempt`: Попытка BOLA/IDOR (запрос к чужому ресурсу).
- `ApiKeyRevoked`: Отзыв ключа при подозрении на компрометацию.
