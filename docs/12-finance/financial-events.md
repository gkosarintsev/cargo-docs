# Каталог финансовых событий

Финансовый домен генерирует события для асинхронного взаимодействия с другими доменами (аналитика, нотификации, бухгалтерия). Для обеспечения аудитного следа (Auditability) каждое событие фиксируется в неизменяемом логе.

## Перечень событий

### `QuoteCalculated`

Рассчитана предварительная стоимость перевозки.

```json
{
  "quote_id": "uuid",
  "order_id": "uuid",
  "base_price": 50000.0,
  "surcharges": 2500.0,
  "currency": "RUB",
  "vat_included": true
}
```

### `InvoiceIssued`

Выставлен счет на оплату.

```json
{
  "invoice_id": "uuid",
  "order_id": "uuid",
  "payer_id": "org_uuid",
  "total_amount": 52500.0,
  "due_date": "2023-12-31"
}
```

### `EscrowHoldAuthorized`

Средства успешно заблокированы на номинальном счете (Безопасная сделка).

```json
{
  "escrow_id": "uuid",
  "order_id": "uuid",
  "amount": 52500.0,
  "payment_method": "B2B_CARD"
}
```

### `PaymentCaptured`

Платеж подтвержден, средства списаны.

```json
{
  "transaction_id": "uuid",
  "invoice_id": "uuid",
  "amount": 52500.0,
  "captured_at": "2023-11-01T10:00:00Z"
}
```

### `PlatformFeeDeducted`

Удержана комиссия платформы.

```json
{
  "order_id": "uuid",
  "fee_amount": 1050.0,
  "fee_type": "TAKE_RATE"
}
```

### `CarrierPayoutInitiated`

Инициирована выплата перевозчику.

```json
{
  "payout_id": "uuid",
  "order_id": "uuid",
  "carrier_id": "org_uuid",
  "amount": 51450.0
}
```

### `CarrierPayoutCompleted`

Выплата перевозчику успешно завершена (получено подтверждение от банка).

```json
{
  "payout_id": "uuid",
  "completed_at": "2023-11-03T12:00:00Z"
}
```

### `FactoringAdvancePaid`

Произведена досрочная выплата по факторингу.

```json
{
  "factoring_request_id": "uuid",
  "carrier_id": "org_uuid",
  "advance_amount": 46305.0,
  "fee_amount": 771.75
}
```

### `DisputeRefundProcessed`

Произведен возврат средств грузовладельцу по результатам спора.

```json
{
  "dispute_id": "uuid",
  "order_id": "uuid",
  "refund_amount": 10000.0,
  "reason": "LATE_PENALTY"
}
```
