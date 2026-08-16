# Нефункциональные требования (NFR)

В данном разделе собрана сводная матрица нефункциональных требований (NFR) для распределенной логистической платформы. Эти требования определяют характеристики системы, связанные с производительностью, масштабируемостью, доступностью, безопасностью и другими атрибутами качества.

## Сводная матрица NFR

| ID               | Категория         | Требование                         | Целевое значение                             | Метод валидации                             | Ссылка                                         |
| :--------------- | :---------------- | :--------------------------------- | :------------------------------------------- | :------------------------------------------ | :--------------------------------------------- |
| **NFR-PERF-01**  | Performance       | Время отклика API поиска (p95)     | < 200 мс                                     | Нагрузочное тестирование (JMeter/Gatling)   | [availability.md](./availability.md)           |
| **NFR-PERF-02**  | Performance       | Время отклика Core API (p95)       | < 150 мс                                     | Мониторинг APM / Нагрузочное тестирование   | [availability.md](./availability.md)           |
| **NFR-SCALE-01** | Scalability       | Обработка пакетов телематики       | До 50 000 пакетов/сек в пике                 | Стресс-тестирование                         | [scalability.md](./scalability.md)             |
| **NFR-SCALE-02** | Scalability       | Горизонтальное автомасштабирование | HPA для Stateless сервисов                   | Chaos Engineering / Нагрузочные тесты       | [scalability.md](./scalability.md)             |
| **NFR-AVAIL-01** | Availability      | Доступность Marketplace Search     | 99.9% (не более 43м даунтайма в месяц)       | Синтетические тесты / SLI дашборды          | [availability.md](./availability.md)           |
| **NFR-AVAIL-02** | Availability      | Доступность GPS Ingestion Gateway  | 99.99% (zero packet drop)                    | Метрики Ingress / Сквозной мониторинг       | [availability.md](./availability.md)           |
| **NFR-SEC-01**   | Security          | Шифрование Data in Transit         | TLS 1.3, mTLS                                | Сканирование уязвимостей, Аудит архитектуры | [security.md](./security.md)                   |
| **NFR-SEC-02**   | Security          | Изоляция тенантов                  | Строгий RBAC/ABAC                            | Тестирование на проникновение (PenTest)     | [security.md](./security.md)                   |
| **NFR-OBS-01**   | Observability     | Покрытие логами и трейсами         | 100% критичных путей                         | Проверка в production-like среде            | [observability.md](./observability.md)         |
| **NFR-OBS-02**   | Observability     | Задержка доставки логов/метрик     | < 10 секунд до дашборда                      | Измерение задержки конвейера                | [observability.md](./observability.md)         |
| **NFR-COMP-01**  | Compliance        | Соответствие 152-ФЗ / GDPR         | Хранение ПДн на территории РФ / Анонимизация | Аудит ИБ, Юридический аудит                 | [compliance.md](./compliance.md)               |
| **NFR-DR-01**    | Disaster Recovery | RPO для критичных данных           | 5 минут                                      | DR-учения                                   | [disaster-recovery.md](./disaster-recovery.md) |
| **NFR-DR-02**    | Disaster Recovery | RTO для платформы в целом          | 4 часа                                       | DR-учения                                   | [disaster-recovery.md](./disaster-recovery.md) |

## Разделы документации

Более подробная информация по каждой категории NFR:

- [Масштабируемость (Scalability)](./scalability.md)
- [Доступность (Availability)](./availability.md)
- [Безопасность (Security)](./security.md)
- [Наблюдаемость (Observability)](./observability.md)
- [Соответствие требованиям (Compliance)](./compliance.md)
- [Аварийное восстановление (Disaster Recovery)](./disaster-recovery.md)
