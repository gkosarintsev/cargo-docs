# Профиль нагрузочного и стресс-тестирования (Load & Performance Testing with k6)

## 1. Цели и профили нагрузки

Нагрузочное тестирование логистической платформы проверяет поведение инфраструктуры при пиковых нагрузках, типичных для логистического рынка (утренний пик публикации грузов в 09:00–11:00, вечерний пик закрытия сделок, массовый выход тягачей на трассы).

| Профиль нагрузки | Целевой RPS | Протокол | Критерий p95 Latency | Критерий Error Rate |
| :--- | :--- | :--- | :--- | :--- |
| **1. GPS Telemetry Stream** | **50 000 pings/sec** | HTTP/2 & TCP Wialon | **$< 80$ мс** | **$< 0.01\%$** |
| **2. Биржевые торги & Бронь**| **2 500 bids/sec** | HTTPS / Redis Redlock| **$< 120$ мс** | **$< 0.05\%$** |
| **3. Поиск грузов (OpenSearch)**| **1 800 RPS** | HTTPS Geo-query | **$< 200$ мс** | **$< 0.01\%$** |
| **4. Загрузка документов (S3)** | **300 req/sec** | HTTPS Multipart WORM | **$< 600$ мс** | **$< 0.1\%$** |

---

## 2. Эталонный скрипт k6: Высоконагруженный прием телеметрии (`gps_ingest.js`)

Скрипт эмулирует работу 150 000 активных тягачей, отправляющих пачки координат:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Кастомные метрики
const IngestedPointsCounter = new Counter('telemetry_ingested_points_total');
const IngestionErrorRate = new Rate('telemetry_failed_requests_rate');
const IngestionLatencyTrend = new Trend('telemetry_ingestion_duration_ms', true);

export const options = {
  scenarios: {
    telemetry_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 5000,
      timeUnit: '1s',
      preAllocatedVUs: 1500,
      maxVUs: 6000,
      stages: [
        { duration: '2m', target: 20000 },  // Плавный разгон до 20k RPS
        { duration: '5m', target: 50000 },  // Выход на пик 50 000 RPS
        { duration: '10m', target: 50000 }, // Плато максимальной нагрузки (10 минут)
        { duration: '3m', target: 5000 },   // Снижение до базового уровня
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<100', 'p(99)<250'],
    'telemetry_failed_requests_rate': ['rate<0.0001'], // Меньше 0.01% ошибок
  },
};

export default function () {
  const vehicleId = `00000000-0000-0000-0004-00000000${String(__VU % 5000).padStart(4, '0')}`;
  
  // Пачка из 5 навигационных точек (Batch ingestion)
  const payload = JSON.stringify({
    batch_id: `btc_${__VU}_${__ITER}_${Date.now()}`,
    vehicle_id: vehicleId,
    client_sent_at: new Date().toISOString(),
    points: [
      { lat: 55.7512 + (__ITER * 0.0001), lng: 37.6184, speed: 78.5, recorded_at: new Date(Date.now() - 4000).toISOString() },
      { lat: 55.7518 + (__ITER * 0.0001), lng: 37.6192, speed: 79.1, recorded_at: new Date(Date.now() - 3000).toISOString() },
      { lat: 55.7524 + (__ITER * 0.0001), lng: 37.6201, speed: 80.0, recorded_at: new Date(Date.now() - 2000).toISOString() },
      { lat: 55.7531 + (__ITER * 0.0001), lng: 37.6210, speed: 81.2, recorded_at: new Date(Date.now() - 1000).toISOString() },
      { lat: 55.7539 + (__ITER * 0.0001), lng: 37.6219, speed: 82.0, recorded_at: new Date().toISOString() },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': `dev_tracker_${__VU}`,
      'Authorization': 'Bearer test-telemetry-ingestion-token',
    },
    tags: { name: 'POST_Telemetry_Batch' },
  };

  const res = http.post('http://gateway.cargo-platform.internal/api/v1/telemetry/batch', payload, params);

  const isSuccess = check(res, {
    'status is 200': (r) => r.status === 200,
    'ingested 5 points': (r) => r.json('ingested_points') === 5,
  });

  if (isSuccess) {
    IngestedPointsCounter.add(5);
  } else {
    IngestionErrorRate.add(1);
  }

  IngestionLatencyTrend.add(res.timings.duration);
}
```

---

## 3. Скрипт k6: Торги и конкурентные ставки на бирже (`auction_contention.js`)

Эмулирует состояние гонки (Race Condition), когда 500 перевозчиков одновременно подают встречные ставки на один и тот же горящий груз:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    flash_crowd_auction: {
      executor: 'shared-iterations',
      vus: 500,
      iterations: 5000,
      maxDuration: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<150'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const loadId = '00000000-0000-0000-0006-000000000001';
  const bidAmount = 140000 - (__ITER * 1000); // Понижение ставки

  const payload = JSON.stringify({
    load_id: loadId,
    bid_amount_rub: bidAmount,
    lead_time_hours: 4,
    vehicle_plate: `A${100 + __VU}KX77`,
  });

  const res = http.post(`http://api.cargo-platform.internal/api/v1/loads/${loadId}/bids`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer carrier_token_${__VU}`,
    },
  });

  check(res, {
    'handled gracefully (200 or 409 conflict)': (r) => r.status === 200 || r.status === 409,
  });
}
```

---

## 4. Критерии качества (Quality Gates для CI/CD)

Пайплайн развертывания в Production блокируется, если в процессе ночного прогона на стенде Staging нарушается хотя бы одно условие:
1. **CPU Saturation**: Утилизация процессоров узлов Kubernetes превышает **$75\%$**.
2. **PostgreSQL Connection Pool**: Занятость пула pgBouncer $> 85\%$ от `max_client_conn`.
3. **Kafka Consumer Lag**: Отставание консьюмеров группы `telemetry-processors` на топике `telemetry.raw` превышает **500 000 сообщений** дольше 1 минуты.
4. **Dead-Letter Accumulation**: В топики `.dlt` попало $> 0$ сообщений типа `POISON_PILL`.
