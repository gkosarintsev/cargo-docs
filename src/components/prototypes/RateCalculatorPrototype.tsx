import React, { useState } from 'react';
import { Calculator, ArrowRight, ShieldCheck, Zap, Info, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

interface RoutePreset {
  id: string;
  name: string;
  distanceKm: number;
  federalKm: number;
  tollsRub: number;
  corridorKey: 'M10_M11' | 'M7_M12' | 'M4_DON' | 'URAL' | 'SIBERIA' | 'DEFAULT';
}

const PRESETS: RoutePreset[] = [
  { id: 'm10', name: 'Москва — Санкт-Петербург (М-11 Нева)', distanceKm: 710, federalKm: 680, tollsRub: 4200, corridorKey: 'M10_M11' },
  { id: 'm7', name: 'Москва — Казань (М-12 Восток)', distanceKm: 820, federalKm: 800, tollsRub: 4900, corridorKey: 'M7_M12' },
  { id: 'm4', name: 'Москва — Ростов-на-Дону (М-4 Дон)', distanceKm: 1100, federalKm: 1050, tollsRub: 3400, corridorKey: 'M4_DON' },
  { id: 'ural', name: 'Москва — Екатеринбург (Урал)', distanceKm: 1780, federalKm: 1750, tollsRub: 5200, corridorKey: 'URAL' },
];

export const RateCalculatorPrototype: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<RoutePreset>(PRESETS[0]);
  const [distanceKm, setDistanceKm] = useState<number>(PRESETS[0].distanceKm);
  const [federalKm, setFederalKm] = useState<number>(PRESETS[0].federalKm);
  const [tollsRub, setTollsRub] = useState<number>(PRESETS[0].tollsRub);
  const [corridorKey, setCorridorKey] = useState<RoutePreset['corridorKey']>(PRESETS[0].corridorKey);

  const [bodyType, setBodyType] = useState<'TENT' | 'ISOTHERM' | 'REEFER_CHILLED' | 'REEFER_FROZEN' | 'ADR'>('TENT');
  const [urgency, setUrgency] = useState<'PLANNED' | 'HOURS_24_48' | 'HOURS_12_24' | 'HOT_12'>('PLANNED');
  const [marketRatio, setMarketRatio] = useState<number>(1.0); // 0.7 = surplus, 1.0 = balance, 1.5 = deficit, 2.2 = critical
  const [cargoValueRub, setCargoValueRub] = useState<number>(4500000);
  const [extraStops, setExtraStops] = useState<number>(0);

  // Accessorial checkboxes
  const [curtainSide, setCurtainSide] = useState<boolean>(false);
  const [curtainRoof, setCurtainRoof] = useState<boolean>(false);
  const [tailLift, setTailLift] = useState<boolean>(false);
  const [moscowPermit, setMoscowPermit] = useState<boolean>(false);
  const [withVat, setWithVat] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  const handleSelectPreset = (p: RoutePreset) => {
    setSelectedPreset(p);
    setDistanceKm(p.distanceKm);
    setFederalKm(p.federalKm);
    setTollsRub(p.tollsRub);
    setCorridorKey(p.corridorKey);
    setIsPublished(false);
  };

  // Pricing math according to docs/12-finance/pricing.md
  const corridorRates: Record<string, number> = {
    M10_M11: 92,
    M7_M12: 96,
    M4_DON: 108,
    URAL: 86,
    SIBERIA: 79,
    DEFAULT: 88,
  };

  const bodyMultipliers: Record<string, { mult: number; label: string }> = {
    TENT: { mult: 1.0, label: 'Тент 20т 82–92м³ (базовый)' },
    ISOTHERM: { mult: 1.10, label: 'Изотермический фургон (+10%)' },
    REEFER_CHILLED: { mult: 1.22, label: 'Рефрижератор +2...+6°C (+22%)' },
    REEFER_FROZEN: { mult: 1.28, label: 'Рефрижератор глубокой заморозки -20°C (+28%)' },
    ADR: { mult: 1.35, label: 'Опасный груз ADR / ДОПОГ (+35%)' },
  };

  const urgencyMultipliers: Record<string, { mult: number; label: string }> = {
    PLANNED: { mult: 1.0, label: 'Плановая подача (>48 часов)' },
    HOURS_24_48: { mult: 1.05, label: 'Стандарт (24–48 часов, +5%)' },
    HOURS_12_24: { mult: 1.15, label: 'Срочно (12–24 часа, +15%)' },
    HOT_12: { mult: 1.25, label: 'Горящий рейс / Hot Load (<12 часов, +25%)' },
  };

  const baseRateKm = corridorRates[corridorKey] ?? corridorRates.DEFAULT;
  const kBody = bodyMultipliers[bodyType].mult;
  const kUrgency = urgencyMultipliers[urgency].mult;

  let kMarket = 1.0;
  if (marketRatio <= 0.7) kMarket = 0.92;
  else if (marketRatio > 2.0) kMarket = 1.25;
  else if (marketRatio > 1.3) kMarket = 1.12;

  const baseFreight = Math.round(distanceKm * baseRateKm * kBody * kUrgency * kMarket);
  const platonFee = Math.round(federalKm * 3.05);

  let accessorials = extraStops * 4500;
  if (curtainSide) accessorials += 2500;
  if (curtainRoof) accessorials += 4000;
  if (tailLift) accessorials += 3500;
  if (moscowPermit) accessorials += 3000;

  const insuranceFee = Math.round(cargoValueRub * 0.0007);
  const targetRateNet = baseFreight + platonFee + tollsRub + accessorials + insuranceFee;

  const vatMultiplier = withVat ? 1.20 : 1.0;
  const targetRate = Math.round(targetRateNet * vatMultiplier);
  const minRate = Math.round(targetRate * 0.92);
  const maxRate = Math.round(targetRate * 1.12);
  const ratePerKm = Math.round((targetRate / distanceKm) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-500/30 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Движок динамического ценообразования (Pricing Engine Prototype)</h3>
            <p className="text-xs text-slate-400">
              Математический расчет рекомендованного фрахта P_target, Платона и платных дорог в реальном времени.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
            <input
              type="checkbox"
              checked={withVat}
              onChange={e => setWithVat(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Включая НДС (20%)</span>
          </label>
        </div>
      </div>

      {/* Preset Route Selectors */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Магистральные транспортные коридоры РФ:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedPreset.id === p.id
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>{p.name.split(' (')[0]}</span>
                <span className="text-blue-400">{p.distanceKm} км</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                {p.name.includes('(') ? p.name.split('(')[1].replace(')', '') : ''} • Платные: {p.tollsRub.toLocaleString('ru-RU')} ₽
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Inputs vs Calculation Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input parameters */}
        <div className="lg:col-span-7 space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span>Параметры грузоперевозки</span>
          </h4>

          {/* Body Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Тип кузова полуприцепа (Body Type Factor)</label>
            <select
              value={bodyType}
              onChange={e => setBodyType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(bodyMultipliers).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Срочность подачи (Lead Time Factor)</label>
            <select
              value={urgency}
              onChange={e => setUrgency(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {Object.entries(urgencyMultipliers).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Market Balance Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Баланс спроса и предложения (Market Index):</span>
              <span className={`font-mono font-bold ${marketRatio > 1.3 ? 'text-amber-400' : marketRatio < 0.8 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {marketRatio <= 0.7 ? 'Профицит тягачей (-8%)' : marketRatio >= 2.0 ? 'Острый дефицит (+25%)' : marketRatio > 1.3 ? 'Умеренный спрос (+12%)' : 'Рыночный баланс (1.0)'}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={marketRatio}
              onChange={e => setMarketRatio(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Профицит машин (0.5x)</span>
              <span>Баланс (1.0x)</span>
              <span>Дефицит (2.5x)</span>
            </div>
          </div>

          {/* Cargo Value & Extra Stops */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Стоимость груза (для страховки 0.07%):</label>
              <div className="relative">
                <input
                  type="number"
                  value={cargoValueRub}
                  onChange={e => setCargoValueRub(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white pl-7 font-mono"
                />
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">₽</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Дополнительные точки выгрузки:</label>
              <input
                type="number"
                min="0"
                max="5"
                value={extraStops}
                onChange={e => setExtraStops(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Accessorial Services */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Дополнительные требования к погрузке:</span>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input type="checkbox" checked={curtainSide} onChange={e => setCurtainSide(e.target.checked)} className="rounded text-blue-600" />
                <span>Боковая растентовка (+2 500 ₽)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input type="checkbox" checked={curtainRoof} onChange={e => setCurtainRoof(e.target.checked)} className="rounded text-blue-600" />
                <span>Верхняя растентовка / кран (+4 000 ₽)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input type="checkbox" checked={tailLift} onChange={e => setTailLift(e.target.checked)} className="rounded text-blue-600" />
                <span>Гидроборт (+3 500 ₽)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700">
                <input type="checkbox" checked={moscowPermit} onChange={e => setMoscowPermit(e.target.checked)} className="rounded text-blue-600" />
                <span>Пропуск в ТТК Москвы (+3 000 ₽)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Calculated Price Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 rounded-2xl border border-blue-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Рекомендованная ставка</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                {withVat ? 'С НДС 20%' : 'Без НДС'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {targetRate.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Эффективная ставка:</span>
                <span className="text-blue-300 font-mono font-bold">{ratePerKm} ₽ / км</span>
              </div>
            </div>

            {/* Negotiation corridor */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Коридор торга (Negotiation Window):
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Мин. порог (-8%):</span>
                  <span className="font-mono font-bold text-slate-300">{minRate.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Макс. лимит (+12%):</span>
                  <span className="font-mono font-bold text-slate-300">{maxRate.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Детализация статьи расходов:</span>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Базовый фрахт ({distanceKm} км × {baseRateKm} ₽):</span>
                  <span className="font-mono">{Math.round(baseFreight * vatMultiplier).toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Система «Платон» ({federalKm} км × 3.05 ₽):</span>
                  <span className="font-mono">{Math.round(platonFee * vatMultiplier).toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Платные участки автодорог (Автодор):</span>
                  <span className="font-mono">{Math.round(tollsRub * vatMultiplier).toLocaleString('ru-RU')} ₽</span>
                </div>
                {accessorials > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Спецусловия и растентовка:</span>
                    <span className="font-mono">{Math.round(accessorials * vatMultiplier).toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Страхование груза (0.07%):</span>
                  <span className="font-mono">{Math.round(insuranceFee * vatMultiplier).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsPublished(true)}
                disabled={isPublished}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isPublished
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 hover:scale-[1.01]'
                }`}
              >
                {isPublished ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Заявка успешно опубликована в Биржу!</span>
                  </>
                ) : (
                  <>
                    <span>Опубликовать заявку по ставке {targetRate.toLocaleString('ru-RU')} ₽</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Факторинг & Take Rate:</span> Агентская комиссия платформы составляет 3.5% при спотовом клиринге. Доступна выплата перевозчику день-в-день за 2.2% комиссии.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
