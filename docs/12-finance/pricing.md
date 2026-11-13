# Модель динамического ценообразования перевозки (Dynamic Pricing Engine)

## 1. Концепция и структура цены

Цена автомобильной грузоперевозки (Full Truckload, FTL) на платформе формируется динамическим движком тарификации (`pricing-service`). Движок вычисляет три ключевых финансовых значения:
1. **$P_{\text{target}}$ (Рекомендованная ставка)**: Математическое матожидание рыночной ставки для быстрого заключения сделки (Market Fair Price).
2. **$P_{\text{min}}$ (Нижний порог безубыточности / Floor Rate)**: Порог, ниже которого ставка не опускается (защита перевозчика от демпинга ниже операционной себестоимости).
3. **$P_{\text{max}}$ (Верхний лимит / Ceiling Rate)**: Максимальный лимит для автоматического акцепта грузовладельцем без дополнительного согласования финдиректора.

---

## 2. Математическая формула тарификатора FTL

Итоговая стоимость перевозки для грузовладельца рассчитывается по формуле:

$$P_{\text{total}} = \left( L_{\text{route}} \times R_{\text{corridor}} \times K_{\text{body}} \times K_{\text{urgency}} \times K_{\text{market}} \right) + S_{\text{platon}} + S_{\text{tolls}} + S_{\text{accessorial}} + S_{\text{insurance}}$$

### 2.1. Переменные и параметры формулы:

| Параметр | Описание | Ед. изм. | Источник данных |
| :--- | :--- | :--- | :--- |
| **$L_{\text{route}}$** | Протяженность маршрута по дорожному графу для грузового ТС | км | Routing Engine (OSRM / OpenRouteService) |
| **$R_{\text{corridor}}$** | Базовая ставка за 1 км для данного транспортного коридора | ₽/км | Исторический клиринг сделок за 30 дней |
| **$K_{\text{body}}$** | Коэффициент спецификации типа кузова полуприцепа | множитель | Справочник типов ТС |
| **$K_{\text{urgency}}$** | Коэффициент срочности подачи (Lead Time) | множитель | Время до планируемого слота погрузки |
| **$K_{\text{market}}$** | Рыночный коэффициент баланса спроса и предложения | множитель | Отношение активных заявок к доступным тягачам |
| **$S_{\text{platon}}$** | Сбор государственной системы «Платон» на федеральных трассах | ₽ | $L_{\text{federal}} \times 3.05 \text{ ₽}$ (постановление РФ) |
| **$S_{\text{tolls}}$** | Официальная стоимость платных участков (М-11, М-12, ЦКАД) | ₽ | Матрица тарифов ГК «Автодор» (Категория 4) |
| **$S_{\text{accessorial}}$** | Дополнительные услуги (растентовка, гидроборт, доп. точки) | ₽ | Фиксированный прейскурант платформы |
| **$S_{\text{insurance}}$** | Страхование ответственности экспедитора / груза | ₽ | $0.07\%$ от заявленной объявленной стоимости груза |

---

## 3. Нормативные коэффициенты и матрицы

### 3.1. Базовые ставки по магистральным коридорам ($R_{\text{corridor}}$ для Тент 20т)

| Коридор | Направление | Дистанция | Базовая ставка $R_{\text{corridor}}$ (без НДС) |
| :--- | :--- | :--- | :--- |
| **М-10 / М-11** | Москва $\leftrightarrow$ Санкт-Петербург | ~710 км | **92 ₽ / км** |
| **М-7 / М-12** | Москва $\leftrightarrow$ Казань | ~820 км | **96 ₽ / км** |
| **М-4 «Дон»** | Москва $\leftrightarrow$ Ростов-на-Дону | ~1 100 км | **105 ₽ / км** |
| **М-4 «Дон»** | Москва $\leftrightarrow$ Краснодар / Новороссийск | ~1 350 км | **112 ₽ / км** |
| **Уральский** | Москва $\leftrightarrow$ Екатеринбург | ~1 780 км | **86 ₽ / км** |
| **Сибирский** | Москва $\leftrightarrow$ Новосибирск | ~3 350 км | **79 ₽ / км** |
| **Межрегион** | Иные направления (дефолтная сетка) | Любая | **88 ₽ / км** |

### 3.2. Коэффициенты типа кузова ($K_{\text{body}}$)

| Тип полуприцепа | Код системы | $K_{\text{body}}$ | Обоснование |
| :--- | :--- | :--- | :--- |
| **Тент стандарт (Euro tent 82–92 м³)** | `TENT_STANDARD` | **1.00** | Базовая единица FTL |
| **Изотермический фургон** | `ISOTHERMAL` | **1.10** | Термоизоляция без активной ХОУ (+10%) |
| **Рефрижератор (+2°C ... +6°C)** | `REEFER_CHILLED` | **1.22** | Амортизация ХОУ, расход дизеля (+22%) |
| **Рефрижератор глубокой заморозки (-20°C)**| `REEFER_FROZEN` | **1.28** | Непрерывная работа компрессора (+28%) |
| **Сцепка / Мега (100–120 м³)** | `JUMBO_MEGA` | **1.15** | Повышенный объем для легковесных грузов |
| **Опасные грузы (ADR / ДОПОГ)** | `ADR_HAZMAT` | **1.35** | Допуски водителя, спецсредства пожаротушения |
| **Бортовой / Открытая площадка** | `FLATBED_OPEN` | **1.12** | Негабаритные нормы, увязка цепями |

### 3.3. Коэффициент срочности подачи ($K_{\text{urgency}}$)

$$\Delta T = T_{\text{pickup}} - T_{\text{publish}}$$

- $\Delta T \ge 48 \text{ часов}$: $K_{\text{urgency}} = 1.00$ (Плановое планирование).
- $24 \le \Delta T < 48 \text{ часов}$: $K_{\text{urgency}} = 1.05$ (+5%).
- $12 \le \Delta T < 24 \text{ часа}$: $K_{\text{urgency}} = 1.15$ (+15%).
- $\Delta T < 12 \text{ часов}$ (Горящий рейс / Hot Load): $K_{\text{urgency}} = 1.25$ (+25%).

### 3.4. Коэффициент баланса рынка ($K_{\text{market}}$)

Рассчитывается в радиусе 150 км от точки погрузки:

$$I_{\text{balance}} = \frac{N_{\text{active\_loads}}}{N_{\text{available\_trucks}}}$$

- $I_{\text{balance}} \le 0.7$ (Профицит машин, «рынок грузовладельца»): $K_{\text{market}} = 0.92$ (-8%).
- $0.7 < I_{\text{balance}} \le 1.3$ (Баланс): $K_{\text{market}} = 1.00$.
- $1.3 < I_{\text{balance}} \le 2.0$ (Дефицит машин): $K_{\text{market}} = 1.12$ (+12%).
- $I_{\text{balance}} > 2.0$ (Острый дефицит / пик сезона): $K_{\text{market}} = 1.25$ (+25%).

### 3.5. Стоимость дополнительных операций ($S_{\text{accessorial}}$)

```
Растентовка боковая (один борт):      + 2 500 ₽
Растентовка полная (бока + крыша):     + 6 000 ₽
Верхняя растентовка (кран):            + 4 000 ₽
Использование гидроборта:              + 3 500 ₽
Дополнительная точка погрузки/выгрузки:+ 4 500 ₽ / точка
Пломбирование тросом с фиксацией:      + 1 000 ₽
Пропуск в центр Москвы (ТТК / Садовое):+ 3 000 ₽
```

---

## 4. Эталонная программная реализация (TypeScript Engine)

Данный модуль компилируется внутри микросервиса `pricing-service`:

```typescript
export interface RouteInput {
  distanceKm: number;
  federalHighwayKm: number;
  tollRoadFeesRub: number;
  corridorKey: 'M10_M11' | 'M7_M12' | 'M4_DON' | 'URAL' | 'SIBERIA' | 'DEFAULT';
}

export interface PricingParameters {
  bodyType: 'TENT_STANDARD' | 'ISOTHERMAL' | 'REEFER_CHILLED' | 'REEFER_FROZEN' | 'JUMBO_MEGA' | 'ADR_HAZMAT';
  leadTimeHours: number;
  marketBalanceRatio: number; // Loads / Trucks
  cargoValueRub: number;
  additionalStopsCount: number;
  accessorialServices: {
    curtainSide?: boolean;
    curtainRoof?: boolean;
    tailLift?: boolean;
    moscowCenterPermit?: boolean;
  };
}

export interface CalculatedRateResult {
  targetRateRub: number;
  minAcceptableRateRub: number; // Floor (-8%)
  maxAcceptableRateRub: number; // Ceiling (+12%)
  breakdown: {
    baseFreightRub: number;
    platonFeeRub: number;
    tollsRub: number;
    accessorialsRub: number;
    insuranceRub: number;
  };
  effectiveRatePerKm: number;
}

const CORRIDOR_RATES: Record<string, number> = {
  M10_M11: 92,
  M7_M12: 96,
  M4_DON: 108,
  URAL: 86,
  SIBERIA: 79,
  DEFAULT: 88,
};

const BODY_MULTIPLIERS: Record<string, number> = {
  TENT_STANDARD: 1.0,
  ISOTHERMAL: 1.10,
  REEFER_CHILLED: 1.22,
  REEFER_FROZEN: 1.28,
  JUMBO_MEGA: 1.15,
  ADR_HAZMAT: 1.35,
};

export function calculateFreightRate(route: RouteInput, params: PricingParameters): CalculatedRateResult {
  const baseRateKm = CORRIDOR_RATES[route.corridorKey] ?? CORRIDOR_RATES.DEFAULT;
  const kBody = BODY_MULTIPLIERS[params.bodyType] ?? 1.0;

  // 1. Urgency Multiplier
  let kUrgency = 1.0;
  if (params.leadTimeHours < 12) kUrgency = 1.25;
  else if (params.leadTimeHours < 24) kUrgency = 1.15;
  else if (params.leadTimeHours < 48) kUrgency = 1.05;

  // 2. Market Multiplier
  let kMarket = 1.0;
  if (params.marketBalanceRatio <= 0.7) kMarket = 0.92;
  else if (params.marketBalanceRatio > 2.0) kMarket = 1.25;
  else if (params.marketBalanceRatio > 1.3) kMarket = 1.12;

  // 3. Base Freight
  const baseFreightRub = Math.round(route.distanceKm * baseRateKm * kBody * kUrgency * kMarket);

  // 4. Platon Toll (3.05 Rub/km on federal roads)
  const platonFeeRub = Math.round(route.federalHighwayKm * 3.05);

  // 5. Accessorials
  let accessorialsRub = params.additionalStopsCount * 4500;
  if (params.accessorialServices.curtainSide) accessorialsRub += 2500;
  if (params.accessorialServices.curtainRoof) accessorialsRub += 4000;
  if (params.accessorialServices.tailLift) accessorialsRub += 3500;
  if (params.accessorialServices.moscowCenterPermit) accessorialsRub += 3000;

  // 6. Cargo Insurance (0.07%)
  const insuranceRub = Math.round(params.cargoValueRub * 0.0007);

  // Total Target Rate
  const targetRateRub = baseFreightRub + platonFeeRub + route.tollRoadFeesRub + accessorialsRub + insuranceRub;

  return {
    targetRateRub,
    minAcceptableRateRub: Math.round(targetRateRub * 0.92),
    maxAcceptableRateRub: Math.round(targetRateRub * 1.12),
    breakdown: {
      baseFreightRub,
      platonFeeRub,
      tollsRub: route.tollRoadFeesRub,
      accessorialsRub,
      insuranceRub,
    },
    effectiveRatePerKm: Math.round((targetRateRub / route.distanceKm) * 10) / 10,
  };
}
```

---

## 5. Налогообложение и факторинг

1. **НДС (20%)**: В интерфейсе все ставки отображаются по умолчанию «без НДС» с переключателем «Включая НДС 20%».
2. **Агентская комиссия платформы (Take Rate)**: 
   - 3.5% при спотовой сделке на бирже.
   - 1.5% для корпоративных контрактных перевозок.
3. **Факторинг (Быстрая оплата в день сдачи CMR/ТрН)**:
   - Комиссия факторинговой компании: 2.2% от суммы фрахта за финансирование в течение 24 часов (вместо стандартной постоплаты 30 банковских дней).
