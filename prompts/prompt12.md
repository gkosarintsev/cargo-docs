# Промпт 12 — Domain Model и Агрегаты (Aggregates)

> **Файлы на выходе:**
>
> - `docs/04-domain/domain-model.md`
> - `docs/04-domain/aggregates.md`

---

## Контекст

Переходим к разделу **Domain Model** (Этап 4).
Критически важно четко разделить бизнес-сущности и не создавать антипаттерн «God Object Order» (из §6 и §13 master-prompt).

Бизнес-цепочка:

```
Load → Offer / Counter Offer → Negotiation → Transport Order → Shipment → Execution → Delivery → Proof of Delivery → Settlement
```

Язык — **русский**. Диаграммы — **Mermaid**.

---

## Задание 1: создай `docs/04-domain/domain-model.md`

### Содержимое документа

1. **Концептуальная модель предметной области**:
   - Mermaid Class/Domain Diagram со всеми ключевыми сущностями логистической платформы.
2. **Разделение и обоснование жизненного цикла сущностей**:
   - Подробно объясни, почему `Load`, `Offer`, `Negotiation`, `TransportOrder`, `Shipment`, `Delivery`, `ProofOfDelivery` и `Settlement` — это **разные сущности**, а не один объект:
     - `Load` — маркетинговое объявление/спрос (может отмениться, устареть, иметь 100 офферов).
     - `Offer` / `CounterOffer` — коммерческое предложение конкретного перевозчика.
     - `Negotiation` — сессия торга между двумя конкретными сторонами.
     - `TransportOrder` — юридический контракт/договор-заявка со стоимостью и обязательствами сторон.
     - `Shipment` — физический процесс перевозки груза (1 Заказ может порождать несколько Shipments, например, мультимодальная доставка или перевозка несколькими машинами).
     - `Execution` — операционный статус исполнения (в пути, на погрузке, поломка).
     - `ProofOfDelivery (PoD)` — документальное и фото-подтверждение передачи груза получателю.
     - `Settlement` — бухгалтерский и финансовый расчет (счет, комиссия, штрафы, оплата).
3. **Организационная структура в домене**:
   - Отношения:
     ```text
     Organization
      ├── Contacts
      ├── Departments
      ├── Fleets
      │    ├── Vehicles
      │    ├── Trailers
      │    └── Drivers
      └── Marketplaces (Private/Public)
           └── Participants
     ```
4. **Классификация сущностей платформы**:
   - Сводная таблица: Имя сущности | Bounded Context | Роль (Aggregate Root / Entity / Value Object / Domain Event / Read Model / Projection).

---

## Задание 2: создай `docs/04-domain/aggregates.md`

### Содержимое документа

Специфицируй каждый **Aggregate Root** логистической платформы по единому шаблону:

1. **Aggregate Root: `Load` (Маркетплейс грузов)**
   - Границы агрегата: `Load` (Root), `CargoSpecification`, `RouteRequirements`, `PriceExpectation`, `PublicationSettings`.
   - Бизнес-инварианты: дата погрузки <= даты выгрузки; вес > 0; нельзя изменить параметры после акцепта предложения.
   - Команды (Commands): `PublishLoad`, `UpdateLoadDetails`, `WithdrawLoad`, `ExpireLoad`, `ReserveLoad`.
   - Генерируемые события: `LoadPublished`, `LoadUpdated`, `LoadWithdrawn`, `LoadReserved`.

2. **Aggregate Root: `TruckOffer` (Маркетплейс транспорта)**
   - Границы: `TruckOffer` (Root), `VehicleReference`, `DriverReference`, `AvailabilityWindow`, `PreferredRoutes`.

3. **Aggregate Root: `Negotiation` (Торги и офферы)**
   - Границы: `Negotiation` (Root), `OfferHistory` (список встречных предложений), `NegotiationParticipant`.
   - Инварианты: нельзя принять просроченный оффер; нельзя делать встречное предложение по уже завершенным переговорам.

4. **Aggregate Root: `TransportOrder` (Коммерческий заказ на перевозку)**
   - Границы: `TransportOrder` (Root), `ContractTerms`, `PaymentCondition`, `OrderSignatures`.

5. **Aggregate Root: `Shipment` (Физическая перевозка)**
   - Границы: `Shipment` (Root), `Stops` (StopList), `CargoItems`, `AssignedVehicle`, `AssignedDriver`, `StatusHistory`, `TelemetrySnapshot`.
   - Инварианты: последовательность прохождения остановок (Stop 1 -> Stop N); нельзя перейти в статус `DELIVERED` без фиксации `AT_DELIVERY` и PoD.

6. **Aggregate Root: `Organization` (Юридическое лицо и структура)**
   - Границы: `Organization` (Root), `DepartmentList`, `ContactList`, `VerificationStatus`.

7. **Aggregate Root: `Fleet` / `Vehicle` (Транспортный ресурс)**
   - Границы: `Vehicle` (Root), `TrailerLink`, `TechnicalSpecs`, `MaintenanceStatus`.

8. **Aggregate Root: `Document` (Юридически значимый документ)**
   - Границы: `Document` (Root), `DocumentVersionList`, `SignatureList`, `AuditTrail`.

9. **Aggregate Root: `Invoice` / `FinancialTransaction` (Финансы)**
   - Границы: `Invoice` (Root), `InvoiceLineItems`, `PaymentAttemptList`, `SettlementRecord`.

---

## Важные замечания для выполнения

- Удели особое внимание чистоте инвариантов и границам транзакционной целостности агрегатов.
- Ни один агрегат не должен содержать прямой ссылки на экземпляр другого агрегата (только по ID: `carrier_id: OrganizationId`, `vehicle_id: VehicleId`).
