import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  Send,
  Building,
  Truck,
  User,
  ArrowRight,
  ExternalLink,
  Cpu
} from 'lucide-react';

export const EtrnValidatorPrototype: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'etrn_workflow' | 'telematics_parser'>('etrn_workflow');

  // ЭТрН Lifecycle state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasDiscrepancy, setHasDiscrepancy] = useState<boolean>(false);
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('Бой 2 коробок кондитерских изделий при транспортировке (смещение паллеты)');
  const [sealNumber, setSealNumber] = useState<string>('PL-883190');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Telematics Raw Packet Parser state
  const [rawPacket, setRawPacket] = useState<string>(
    '#D#200324;143015;5545.1234;N;03737.5678;E;78;142;185;14;1.2;3;0;12.6,0.0;0;pwr_ext:1:24.4,can_fuel_level:1:78,temp_reefer:2:-18.5;F3A1'
  );
  const [parsedTelemetry, setParsedTelemetry] = useState<any>(null);

  const parseWialonPacket = (packet: string) => {
    try {
      if (!packet.startsWith('#D#')) {
        return { error: 'Неверный заголовок: ожидается пакет #D# протокола Wialon IPS v2.0' };
      }
      const clean = packet.replace('#D#', '').replace('\r\n', '');
      const parts = clean.split(';');

      const dateStr = parts[0]; // 200324 -> 20.03.2024
      const timeStr = parts[1]; // 143015 -> 14:30:15
      const latRaw = parseFloat(parts[2]);
      const latHem = parts[3];
      const lonRaw = parseFloat(parts[4]);
      const lonHem = parts[5];
      const speed = parseFloat(parts[6]);
      const course = parseFloat(parts[7]);
      const altitude = parseFloat(parts[8]);
      const sats = parseInt(parts[9]);
      const hdop = parseFloat(parts[10]);

      // NMEA DDMM.MMMM to Decimal Degrees
      const latDeg = Math.floor(latRaw / 100);
      const latMin = latRaw - latDeg * 100;
      const latDec = Math.round((latDeg + latMin / 60) * 1000000) / 1000000 * (latHem === 'S' ? -1 : 1);

      const lonDeg = Math.floor(lonRaw / 100);
      const lonMin = lonRaw - lonDeg * 100;
      const lonDec = Math.round((lonDeg + lonMin / 60) * 1000000) / 1000000 * (lonHem === 'W' ? -1 : 1);

      return {
        protocol: 'Wialon IPS v2.0',
        timestamp: `20${dateStr.slice(4, 6)}-${dateStr.slice(2, 4)}-${dateStr.slice(0, 2)}T${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}Z`,
        latitude: latDec,
        longitude: lonDec,
        speedKmh: speed,
        courseDeg: course,
        altitudeM: altitude,
        satellites: sats,
        hdop,
        isValidGps: hdop <= 2.5 && sats >= 4,
        sensors: {
          externalVoltage: '24.4 V',
          fuelLevelPercent: '78%',
          reeferTemperature: '-18.5 °C',
        },
        crc16: parts[parts.length - 1],
      };
    } catch (e: any) {
      return { error: `Ошибка парсинга: ${e.message}` };
    }
  };

  const handleParse = () => {
    setParsedTelemetry(parseWialonPacket(rawPacket));
  };

  const generateXmlPreview = () => {
    return `<?xml version="1.0" encoding="windows-1251"?>
<!-- Формат ФНС Приказ № ЕД-7-26/1065@ (КНД 1110350) -->
<Файл ИдФайл="DP_TRNAKL_2BM-7707083893_2BM-7812994011_20240320_A9182301" ВерсФорм="5.01" ВерсПрог="CargoDocs 2.4">
  <Документ КНД="1110350" ДатаДок="20.03.2024" НомДок="L-9042">
    <!-- ТИТУЛ 1: ГРУЗООТПРАВИТЕЛЬ (ОБСТОЯТЕЛЬСТВА ПЕРЕВОЗКИ) -->
    <Титул1 Статус="${currentStep >= 1 ? 'ПОДПИСАН' : 'ЧЕРНОВИК'}">
      <Грузоотпр ИНН="7707083893" Наим="ООО Ритейл-Север" ОГРН="1027700132195"/>
      <Перевозчик ИНН="7812994011" Наим="ООО Транс-Магистраль" ОГРН="1037821094821"/>
      <Грузополуч ИНН="781001001" Наим="ООО Северо-Запад Дистрибуция"/>
      <Груз Наим="Кондитерские изделия (Паллеты)" МассаБрутто="19500" КолМест="33"/>
      <ТранспСр ГосНомерТягач="А742КХ77" ГосНомерПрицеп="ВР112077" Марка="Volvo FH16"/>
      <Водитель Фамилия="Соколов" Имя="Михаил" Отчество="Иванович" НомерВУ="7722918234"/>
      <ПодписьУКЭП Сертификат="00E1928301BFA" МЧД="a9182301-bf12-4109-8812-921829012384"/>
    </Титул1>

    <!-- ТИТУЛ 2: ПЕРЕВОЗЧИК (ПРИЕМКА ГРУЗА НА СКЛАДЕ) -->
    <Титул2 Статус="${currentStep >= 2 ? 'ПОДПИСАН' : 'ОЖИДАЕТСЯ'}">
      <ДатаВремяПриема>${currentStep >= 2 ? '20.03.2024 10:45:00' : '—'}</ДатаВремяПриема>
      <НомерПломбы>${sealNumber}</НомерПломбы>
      <СостояниеГруза>${currentStep >= 2 ? 'Груз и тара в исправном состоянии, пломба навешена' : '—'}</СостояниеГруза>
      <ПодписьВодителя Тип="ПЭП_СМС" ИдСессии="pep_901284"/>
      <ЗаверкаДиспетчера СертификатУКЭП="00F8912801CDE"/>
    </Титул2>

    <!-- ТИТУЛ 3: ГРУЗОПОЛУЧАТЕЛЬ (ВЫДАЧА И ПРИЕМКА В ПУНКТЕ НАЗНАЧЕНИЯ) -->
    <Титул3 Статус="${currentStep >= 3 ? (hasDiscrepancy ? 'С_ОГОВОРКАМИ' : 'ПОДПИСАН') : 'ОЖИДАЕТСЯ'}">
      <ДатаВремяСдачи>${currentStep >= 3 ? '21.03.2024 16:30:00' : '—'}</ДатаВремяСдачи>
      <СостояниеТары>${currentStep >= 3 ? (hasDiscrepancy ? 'ПОВРЕЖДЕНИЕ' : 'ИСПРАВНО') : '—'}</СостояниеТары>
      ${hasDiscrepancy && currentStep >= 3 ? `<АктРасхождений Номер="АКТ-12">${discrepancyNote}</АктРасхождений>` : ''}
      <ПодписьГрузополучателя СертификатУКЭП="00C44102941BA"/>
    </Титул3>

    <!-- ТИТУЛ 4: ПЕРЕВОЗЧИК (ФИНАЛИЗАЦИЯ И ЗАКРЫТИЕ В ГИС ЭПД) -->
    <Титул4 Статус="${currentStep >= 4 ? 'ЗАКРЫТ' : 'ОЖИДАЕТСЯ'}">
      <ГИС_ЭПД_Ид>${currentStep >= 4 ? 'urn:gisepd:uuid:e0819234-bf12-4091-8812-901283901238' : 'РЕГИСТРАЦИЯ_ПРИ_ЗАКРЫТИИ'}</ГИС_ЭПД_Ид>
      <СтатусЭТрН>${currentStep >= 4 ? 'COMPLETED_LEGAL' : 'IN_PROGRESS'}</СтатусЭТрН>
    </Титул4>
  </Документ>
</Файл>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateXmlPreview());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Интерактивный эмулятор ЭТрН (ГИС ЭПД) & Парсер телематики</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Сквозное моделирование 4 титулов электронной транспортной накладной по Приказу ФНС № ЕД-7-26/1065@ и декодер аппаратных пакетов.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('etrn_workflow')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'etrn_workflow'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Жизненный цикл 4 титулов ЭТрН
          </button>
          <button
            onClick={() => setActiveTab('telematics_parser')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTab === 'telematics_parser'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Декодер Wialon / EGTS
          </button>
        </div>
      </div>

      {activeTab === 'etrn_workflow' && (
        <div className="space-y-6">
          {/* Stepper Wizard Bar */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep >= 1
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Титул 1</span>
                  {currentStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span>1</span>}
                </div>
                <div className="text-xs font-bold text-white mt-1">Отправитель</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Условия & УКЭП + МЧД</div>
              </div>

              {/* Step 2 */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep >= 2
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : currentStep === 1
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Титул 2</span>
                  {currentStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span>2</span>}
                </div>
                <div className="text-xs font-bold text-white mt-1">Перевозчик (Приемка)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Пломба & ПЭП водителя</div>
              </div>

              {/* Step 3 */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep >= 3
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : currentStep === 2
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Титул 3</span>
                  {currentStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span>3</span>}
                </div>
                <div className="text-xs font-bold text-white mt-1">Получатель (Сдача)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Акт расхождений / УКЭП</div>
              </div>

              {/* Step 4 */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStep >= 4
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                    : currentStep === 3
                    ? 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Титул 4</span>
                  {currentStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-purple-400" /> : <span>4</span>}
                </div>
                <div className="text-xs font-bold text-white mt-1">ГИС ЭПД Финализация</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Закрытие & Бухгалтерия</div>
              </div>
            </div>
          </div>

          {/* Interactive Step Actions and XML Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Управление состоянием документа
                </h4>

                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="text-slate-300 font-semibold">1. Формирование Титула 1 (Грузоотправитель)</div>
                      <p className="text-[11px] text-slate-400">
                        Организация ООО «Ритейл-Север» оформляет сведения о 33 паллетах, назначает тягач А742КХ77 и водителя Соколова М.И.
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>МЧД формат 003 проверена в реестре ФНС: АКТИВНА</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Подписать Титул 1 и отправить в ИС ЭПД</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="text-slate-300 font-semibold">2. Приемка груза водителем (Титул 2)</div>
                      <p className="text-[11px] text-slate-400">
                        Водитель завершил погрузку, проверил целостность упаковки и навесил тросовую пломбу.
                      </p>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400">Номер пломбы:</label>
                        <input
                          type="text"
                          value={sealNumber}
                          onChange={e => setSealNumber(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentStep(3)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Подтвердить приемку груза (Титул 2)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2.5">
                      <div className="text-slate-300 font-semibold">3. Сдача груза получателю (Титул 3)</div>
                      <p className="text-[11px] text-slate-400">
                        Тягач прибыл в Санкт-Петербург на склад «Шушары». Проводится входной контроль.
                      </p>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={hasDiscrepancy}
                          onChange={e => setHasDiscrepancy(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        <span className="font-semibold text-amber-400">Зафиксировать акт расхождений / бой груза</span>
                      </label>

                      {hasDiscrepancy && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="text-[10px] text-slate-400">Примечание к акту расхождений:</label>
                          <textarea
                            value={discrepancyNote}
                            onChange={e => setDiscrepancyNote(e.target.value)}
                            rows={2}
                            className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2 text-xs text-amber-200 font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentStep(4)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Подписать Титул 3 получателем (УКЭП)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-950/30 border border-purple-500/50 rounded-xl text-xs space-y-2 text-purple-200">
                      <div className="font-bold flex items-center gap-1.5 text-purple-300">
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                        <span>4. ЭТрН успешно зарегистрирована и закрыта в ГИС ЭПД!</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Все 4 титула юридически зафиксированы Минтрансом РФ. Документ доступен в Диадок и СБИС. Бухгалтерия может запускать расчет факторинга.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setHasDiscrepancy(false);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Начать новый сценарий ЭТрН</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Статус ГИС ЭПД:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {currentStep === 4 ? 'COMPLETED (Закрыт)' : 'IN_TRANSIT (Активен)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Live XML Code Preview */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-mono flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-400" />
                  <span>Структура XML (Приказ ФНС № ЕД-7-26/1065@)</span>
                </span>
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-[11px] flex items-center gap-1 transition-all"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Скопировано!' : 'Копировать XML'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed shadow-inner">
                <pre>{generateXmlPreview()}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'telematics_parser' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Декодер аппаратных пакетов Wialon IPS v2.0 / EGTS</span>
            </h4>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Сырой входящий TCP пакет (#D#):</label>
              <textarea
                value={rawPacket}
                onChange={e => setRawPacket(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleParse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <span>Декодировать пакет телеметрии</span>
            </button>

            {parsedTelemetry && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-fade-in text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Результат парсинга:</span>
                  <span className={parsedTelemetry.isValidGps ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {parsedTelemetry.isValidGps ? '✅ Координаты WGS-84 валидны' : '⚠️ Погрешность HDOP > 2.5'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Широта (Lat):</span>
                    <span className="text-white font-bold">{parsedTelemetry.latitude}°</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Долгота (Lon):</span>
                    <span className="text-white font-bold">{parsedTelemetry.longitude}°</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Скорость:</span>
                    <span className="text-white font-bold">{parsedTelemetry.speedKmh} км/ч</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Спутники / HDOP:</span>
                    <span className="text-slate-300">{parsedTelemetry.satellites} шт / {parsedTelemetry.hdop}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Датчик ХОУ (Реф):</span>
                    <span className="text-sky-400 font-bold">{parsedTelemetry.sensors?.reeferTemperature}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-500 block">Топливо в баке:</span>
                    <span className="text-emerald-400 font-bold">{parsedTelemetry.sensors?.fuelLevelPercent}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Квитанция шлюза (ACK):</span>
                  <span className="text-blue-400 font-bold">#AD#1\r\n</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
