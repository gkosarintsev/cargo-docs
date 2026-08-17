# Авторизация

- **Модель управления доступом**: Гибридная модель RBAC (Role-Based Access Control) + ABAC (Attribute-Based Access Control).
- **Базовые системные роли**: 
  - `ORG_ADMIN` (Владелец)
  - `DISPATCHER` (Диспетчер-логист)
  - `FINANCE` (Бухгалтер)
  - `DRIVER` (Водитель)
- **Гранулярные привилегии (Permissions)**: 
  - `PERM_LOAD_CREATE`, `PERM_LOAD_DELETE`
  - `PERM_OFFER_ACCEPT`, `PERM_OFFER_SUBMIT`
  - `PERM_FINANCE_PAY`, `PERM_INVOICE_APPROVE`
  - `PERM_AUDIT_VIEW`
- **Проверки ABAC**: Правила, зависящие от атрибутов. Например, диспетчер может редактировать груз, только если его статус = `DRAFT` или `PUBLISHED`.
