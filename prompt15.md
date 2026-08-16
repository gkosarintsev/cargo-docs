# Промпт 15 — Конечные автоматы (State Machines)

> **Файлы на выходе:**
>
> - `docs/04-domain/state-machines/load.md`
> - `docs/04-domain/state-machines/offer.md`
> - `docs/04-domain/state-machines/negotiation.md`
> - `docs/04-domain/state-machines/transport-order.md`
> - `docs/04-domain/state-machines/shipment.md`
> - `docs/04-domain/state-machines/document.md`
> - `docs/04-domain/state-machines/payment.md`
> - `docs/04-domain/state-machines/driver.md`
> - `docs/04-domain/state-machines/vehicle.md`

---

## Контекст

Проектируем конечные автоматы (State Machines) для всех ключевых сущностей логистической платформы (из §12 и §34 master-prompt).
Конечные автоматы строго регламентируют жизненный цикл объектов, защищают от недопустимых переходов и обеспечивают детерминированность бизнес-процессов.

Язык — **русский**. Диаграммы — **Mermaid stateDiagram-v2**.

---

## Общий стандарт описания для каждого State Machine файла

Каждый файл должен содержать:

1. **Mermaid-диаграмму** (`stateDiagram-v2`) со всеми состояниями, переходами и триггерами.
2. **Таблицу состояний (States Definition)**:
   - Код состояния (UPPERCASE)
   - Бизнес-смысл
   - Является ли начальным / промежуточным / финальным (terminal).
3. **Матрицу допустимых переходов (Transition Matrix)**:
   - Исходное состояние → Целевое состояние
   - Инициатор (Shipper / Carrier / Driver / System Automated / Admin)
   - Событие-триггер (Event / Command)
   - Предусловия / Guards (проверки перед переходом)
   - Побочные эффекты (генерируемые события, отправка нотификаций, запись в outbox).
4. **Обработку исключительных и аварийных сценариев** (Rollbacks, Cancellation, Disputes).

---

## Специфика отдельных автоматов

### 1. `state-machines/shipment.md` (Физическая перевозка — САМЫЙ ПОДРОБНЫЙ)

- Состояния:
  - `CREATED` → `ASSIGNED` (назначен перевозчик)
  - `DRIVER_ASSIGNED` (назначен конкретный водитель и тягач)
  - `CONFIRMED_BY_DRIVER` (водитель подтвердил рейс в приложении)
  - `EN_ROUTE_TO_PICKUP` (на пути к точке погрузки)
  - `AT_PICKUP` (прибыл на склад погрузки, сработал геофенс / отметка)
  - `LOADING` (идет процесс погрузки)
  - `LOADED` (погрузка завершена, eCMR подписана)
  - `IN_TRANSIT` (в пути)
  - `AT_DELIVERY` (прибыл на точку выгрузки)
  - `UNLOADING` (идет выгрузка)
  - `DELIVERED` (груз сдан, фото PoD передано)
  - `DOCUMENTS_PENDING` (ожидаются оригиналы / финальное подписание eCMR)
  - `COMPLETED` (рейс успешно закрыт)
  - `EXCEPTION` (ДТП, поломка ТС, простой > нормы)
  - `CANCELLED` (отмена рейса)
  - `FAILED` (срыв доставки, возврат груза)
- Отдельно опиши: автоматические переходы по геозонам (Auto-transitions), ручные оверрайды диспетчером, логику возврата груза (`RETURN_IN_PROGRESS` → `RETURNED`).

### 2. `state-machines/load.md` (Груз на маркетплейсе)

- Состояния: `DRAFT` → `MODERATION` → `PUBLISHED` → `UNDER_NEGOTIATION` → `BOOKED` → `ARCHIVED` / `EXPIRED` / `CANCELLED`.

### 3. `state-machines/offer.md` и `negotiation.md` (Офферы и торг)

- Состояния Offer: `SUBMITTED` → `COUNTER_OFFERED` → `ACCEPTED` → `REJECTED` → `EXPIRED` → `WITHDRAWN`.
- Состояния Negotiation: `ACTIVE` → `AGREED` → `DECLINED` → `EXPIRED`.

### 4. `state-machines/transport-order.md` (Юридический заказ)

- Состояния: `DRAFT` → `PENDING_CARRIER_SIGNATURE` → `PENDING_SHIPPER_SIGNATURE` → `ACTIVE` → `FULFILLED` → `SETTLED` → `DISPUTED` → `CANCELLED`.

### 5. `state-machines/document.md` (Электронный документ)

- Состояния: `DRAFT` → `UPLOADED` → `PENDING_SIGNATURE` → `PARTIALLY_SIGNED` → `SIGNED` → `REJECTED` → `ARCHIVED`.

### 6. `state-machines/payment.md` (Платежи и взаиморасчеты)

- Состояния: `PENDING_INVOICE` → `INVOICE_ISSUED` → `PAYMENT_PENDING` → `ESCROW_HOLD` → `PAID` → `REFUNDED` → `FAILED`.

### 7. `state-machines/driver.md` и `vehicle.md` (Ресурсы автопарка)

- Состояния Driver: `AVAILABLE` → `ASSIGNED` → `ON_DUTY` → `RESTING` → `OFF_DUTY` → `BLOCKED`.
- Состояния Vehicle: `AVAILABLE` → `ASSIGNED_TO_ORDER` → `IN_MAINTENANCE` → `DECOMMISSIONED`.

---

## Важные замечания для выполнения

- Убедись, что все диаграммы компилируются без ошибок в Mermaid.
- Не допускай тупиковых недостижимых состояний.
- Четко разграничивай состояния заказа (`TransportOrder`) и физической перевозки (`Shipment`).
