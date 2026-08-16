# Агрегаты предметной области (Aggregates)

Спецификация Aggregate Roots логистической платформы. Ни один агрегат не содержит прямой объектной ссылки на экземпляр другого агрегата, связь осуществляется исключительно по идентификатору (например, `carrier_id: OrganizationId`, `vehicle_id: VehicleId`), что обеспечивает строгие границы транзакционной целостности.

---

## 1. Aggregate Root: `Load` (Маркетплейс грузов)

- **Границы агрегата**: `Load` (Root), `CargoSpecification` (VO), `RouteRequirements` (VO), `PriceExpectation` (VO), `PublicationSettings` (VO).
- **Бизнес-инварианты**:
  - Дата погрузки должна быть меньше или равна дате выгрузки.
  - Общий вес груза строго больше 0.
  - Нельзя изменить критичные параметры (маршрут, вес) после акцепта предложения или перехода в статус резерва.
- **Команды (Commands)**: `PublishLoad`, `UpdateLoadDetails`, `WithdrawLoad`, `ExpireLoad`, `ReserveLoad`.
- **Генерируемые события (Events)**: `LoadPublished`, `LoadUpdated`, `LoadWithdrawn`, `LoadReserved`, `LoadExpired`.

---

## 2. Aggregate Root: `TruckOffer` (Маркетплейс транспорта)

- **Границы агрегата**: `TruckOffer` (Root), `VehicleReference` (VO), `DriverReference` (VO), `AvailabilityWindow` (VO), `PreferredRoutes` (VO).
- **Бизнес-инварианты**:
  - Окно доступности должно быть валидным (старт <= конец).
  - Ссылка на ТС и водителя должна быть заполнена (если это обязательное требование платформы для оффера).
- **Команды (Commands)**: `PublishTruckOffer`, `UpdateTruckOffer`, `RevokeTruckOffer`.
- **Генерируемые события (Events)**: `TruckOfferPublished`, `TruckOfferUpdated`, `TruckOfferRevoked`.

---

## 3. Aggregate Root: `Negotiation` (Торги и офферы)

- **Границы агрегата**: `Negotiation` (Root), `OfferHistory` (список встречных предложений - Entity/VO), `NegotiationParticipant` (VO).
- **Бизнес-инварианты**:
  - Нельзя принять просроченный оффер.
  - Нельзя делать встречное предложение по уже завершенным, отклоненным или заблокированным переговорам.
  - Участники переговоров фиксируются при создании и не могут быть изменены.
- **Команды (Commands)**: `StartNegotiation`, `SubmitCounterOffer`, `AcceptOffer`, `RejectOffer`, `CancelNegotiation`.
- **Генерируемые события (Events)**: `NegotiationStarted`, `CounterOfferSubmitted`, `OfferAccepted`, `OfferRejected`, `NegotiationCancelled`.

---

## 4. Aggregate Root: `TransportOrder` (Коммерческий заказ на перевозку)

- **Границы агрегата**: `TransportOrder` (Root), `ContractTerms` (VO), `PaymentCondition` (VO), `OrderSignatures` (VO).
- **Бизнес-инварианты**:
  - Сумма заказа не может быть отрицательной.
  - Стороны договора должны иметь валидные идентификаторы.
  - Заказ не может быть отменен после перехода в статус исполнения без запуска специального процесса расторжения/штрафов.
- **Команды (Commands)**: `CreateTransportOrder`, `SignTransportOrder`, `CancelTransportOrder`, `ModifyOrderTerms`.
- **Генерируемые события (Events)**: `TransportOrderCreated`, `TransportOrderSigned`, `TransportOrderCancelled`.

---

## 5. Aggregate Root: `Shipment` (Физическая перевозка)

- **Границы агрегата**: `Shipment` (Root), `Stops` (StopList - Entity), `CargoItems` (VO), `AssignedVehicle` (VO), `AssignedDriver` (VO), `StatusHistory` (VO), `TelemetrySnapshot` (VO).
- **Бизнес-инварианты**:
  - Строгая последовательность прохождения остановок (Stop 1 -> Stop N). Нельзя завершить Stop 2, если не завершен Stop 1.
  - Нельзя перейти в конечный статус `DELIVERED` без фиксации события `AT_DELIVERY` и прикрепления PoD (Proof of Delivery).
- **Команды (Commands)**: `CreateShipment`, `AssignResource`, `RecordStopArrival`, `RecordStopDeparture`, `CompleteShipment`, `UpdateTelemetry`.
- **Генерируемые события (Events)**: `ShipmentCreated`, `ResourceAssigned`, `ShipmentDeparted`, `StopArrived`, `StopDeparted`, `ShipmentDelivered`.

---

## 6. Aggregate Root: `Organization` (Юридическое лицо и структура)

- **Границы агрегата**: `Organization` (Root), `DepartmentList` (Entity), `ContactList` (Entity), `VerificationStatus` (VO).
- **Бизнес-инварианты**:
  - Организация должна иметь как минимум один основной контакт.
  - Изменение юридических реквизитов сбрасывает статус верификации.
- **Команды (Commands)**: `RegisterOrganization`, `UpdateProfile`, `AddDepartment`, `VerifyOrganization`, `SuspendOrganization`.
- **Генерируемые события (Events)**: `OrganizationRegistered`, `ProfileUpdated`, `OrganizationVerified`, `OrganizationSuspended`.

---

## 7. Aggregate Root: `Fleet` / `Vehicle` (Транспортный ресурс)

- **Границы агрегата**: `Vehicle` (Root), `TrailerLink` (VO), `TechnicalSpecs` (VO), `MaintenanceStatus` (VO).
- **Бизнес-инварианты**:
  - Транспортное средство не может быть назначено на рейс (Shipment), если находится в статусе обслуживания/ремонта.
  - Сцепка (TrailerLink) может указывать только на валидный активный прицеп.
- **Команды (Commands)**: `RegisterVehicle`, `UpdateTechnicalSpecs`, `LinkTrailer`, `SetMaintenanceStatus`.
- **Генерируемые события (Events)**: `VehicleRegistered`, `TrailerLinked`, `MaintenanceStarted`, `MaintenanceCompleted`.

---

## 8. Aggregate Root: `Document` (Юридически значимый документ)

- **Границы агрегата**: `Document` (Root), `DocumentVersionList` (Entity), `SignatureList` (Entity), `AuditTrail` (VO).
- **Бизнес-инварианты**:
  - Документ не может быть изменен (создается новая версия) после того, как поставлена хотя бы одна подпись.
  - При создании новой версии предыдущие подписи становятся недействительными для текущей версии (требуется переподписание).
- **Команды (Commands)**: `UploadDocument`, `CreateDocumentVersion`, `SignDocument`, `RevokeDocument`.
- **Генерируемые события (Events)**: `DocumentUploaded`, `DocumentVersionCreated`, `DocumentSigned`.

---

## 9. Aggregate Root: `Invoice` / `FinancialTransaction` (Финансы)

- **Границы агрегата**: `Invoice` (Root), `InvoiceLineItems` (Entity), `PaymentAttemptList` (Entity), `SettlementRecord` (VO).
- **Бизнес-инварианты**:
  - Общая сумма Invoice должна в точности равняться сумме всех LineItems.
  - Оплаченная сумма не может превышать итоговую сумму счета (без явной обработки переплаты).
  - Выставленный счет (Issued) не может быть удален, только сторнирован.
- **Команды (Commands)**: `IssueInvoice`, `RegisterPaymentAttempt`, `SettleInvoice`, `CancelInvoice`.
- **Генерируемые события (Events)**: `InvoiceIssued`, `PaymentAttempted`, `InvoiceSettled`, `InvoiceCancelled`.
