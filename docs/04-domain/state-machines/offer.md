# Конечный автомат: Оффер (Offer)

## 1. Диаграмма состояний

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED
    SUBMITTED --> COUNTER_OFFERED : Counter Offer
    COUNTER_OFFERED --> ACCEPTED : Accept
    COUNTER_OFFERED --> REJECTED : Reject
    SUBMITTED --> ACCEPTED : Accept
    SUBMITTED --> REJECTED : Reject
    SUBMITTED --> WITHDRAWN : Withdraw
    COUNTER_OFFERED --> WITHDRAWN : Withdraw
    SUBMITTED --> EXPIRED : Timeout
    COUNTER_OFFERED --> EXPIRED : Timeout

    ACCEPTED --> [*]
    REJECTED --> [*]
    WITHDRAWN --> [*]
    EXPIRED --> [*]
```

## 2. Таблица состояний (States Definition)

| Код состояния     | Бизнес-смысл                                           | Тип           |
| ----------------- | ------------------------------------------------------ | ------------- |
| `SUBMITTED`       | Оффер отправлен другой стороне                         | Начальное     |
| `COUNTER_OFFERED` | Получено встречное предложение (изменение цены/сроков) | Промежуточное |
| `ACCEPTED`        | Оффер принят                                           | Финальное     |
| `REJECTED`        | Оффер отклонен                                         | Финальное     |
| `WITHDRAWN`       | Инициатор отозвал свой оффер                           | Финальное     |
| `EXPIRED`         | Время действия оффера истекло                          | Финальное     |

## 3. Матрица переходов (Transition Matrix)

| Исходное → Целевое              | Инициатор | Событие-триггер | Предусловия                      | Эффекты                                    |
| ------------------------------- | --------- | --------------- | -------------------------------- | ------------------------------------------ |
| `SUBMITTED` → `ACCEPTED`        | Recipient | Accept          | Груз в статусе UNDER_NEGOTIATION | Изменение статуса Negotiation, создание TO |
| `SUBMITTED` → `COUNTER_OFFERED` | Recipient | Submit Counter  | -                                | Уведомление инициатору                     |
| `SUBMITTED` → `WITHDRAWN`       | Initiator | Withdraw        | Не был принят                    | Оффер аннулируется                         |
| `SUBMITTED` → `EXPIRED`         | System    | TTL Expired     | Истек срок годности оффера       | -                                          |

## 4. Обработка исключений

- Если один оффер переходит в `ACCEPTED`, все остальные офферы в рамках торга по данному грузу автоматически переводятся в `REJECTED`.
