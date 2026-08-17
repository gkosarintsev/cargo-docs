# Unit-тесты

## Принципы изоляции
Доменная модель тестируется в полной изоляции от баз данных, фреймворков и сетевых протоколов. В тестах не используются моки для доменных сущностей.

## Паттерн AAA (Arrange-Act-Assert)
```python
def test_load_cannot_be_booked_twice():
    # Arrange
    load = Load(id=1, status=LoadStatus.PUBLISHED)
    load.book(carrier_id=101)
    
    # Act & Assert
    with pytest.raises(DomainException) as exc:
        load.book(carrier_id=102)
    assert "Load already booked" in str(exc.value)
```

## Property-Based Testing
Использование Hypothesis (Python) или RapidCheck (C++) для автоматической генерации сотен пограничных случаев проверки инвариантов сумм, габаритов, гео-координат.
