# Спецификации Protobuf / gRPC

В данном каталоге расположены контракты Protocol Buffers v3 для межсервисного взаимодействия в архитектурном стиле Modular Monolith / Microservices, а также для высоконагруженного стриминга GPS телеметрии.

## Каталог контрактов

| Контракт | Пакет | Назначение |
| :--- | :--- | :--- |
| [`telemetry.proto`](telemetry.proto) | `cargo.telemetry.v1` | Высоконагруженный прием и стриминг точек GPS/ГЛОНАСС, датчиков топлива и рефрижератора |
| [`orders.proto`](orders.proto) | `cargo.orders.v1` | Межсервисный RPC интерфейс управления жизненным циклом транспортных заказов и назначением парка |
| [`matching.proto`](matching.proto) | `cargo.matching.v1` | Высокопроизводительный движок сопоставления и ранжирования пар «Груз — Транспорт» |

## Генерация кода (Protoc & Buf)

Контракты компилируются с помощью `buf build` или напрямую через `protoc`:

```bash
# Генерация для Go:
protoc --go_out=. --go-grpc_out=. docs/14-api/proto/*.proto

# Генерация для TypeScript (ts-proto):
protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=. docs/14-api/proto/*.proto
```
