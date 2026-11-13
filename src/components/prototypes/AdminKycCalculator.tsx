import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Building2,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Award,
  Scale,
  Truck,
  HelpCircle
} from 'lucide-react';

interface CompanyPreset {
  name: string;
  inn: string;
  yearsInBusiness: number;
  ownedTrucks: number;
  lawsuitsSumRub: number;
  fnsFlags: boolean;
  completedTripsCount: number;
  description: string;
}

const PRESETS: CompanyPreset[] = [
  {
    name: 'ООО "Ритейл-Север"',
    inn: '7707083893',
    yearsInBusiness: 6,
    ownedTrucks: 18,
    lawsuitsSumRub: 0,
    fnsFlags: false,
    completedTripsCount: 142,
    description: 'Крупный ритейлер, идеальная репутация, белая налоговая история',
  },
  {
    name: 'ООО "Транс-Магистраль"',
    inn: '7812994011',
    yearsInBusiness: 2.5,
    ownedTrucks: 8,
    lawsuitsSumRub: 250000,
    fnsFlags: false,
    completedTripsCount: 38,
    description: 'Надежный региональный автопарк, стандартные рабочие споры',
  },
  {
    name: 'ООО "Быстрая-Доставка" (Подозрительная)',
    inn: '5024119022',
    yearsInBusiness: 0.4,
    ownedTrucks: 0,
    lawsuitsSumRub: 3800000,
    fnsFlags: true,
    completedTripsCount: 1,
    description: 'Фирма-однодневка: массовый адрес, иски о невыплате за топливо',
  },
];

export const AdminKycCalculator: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [years, setYears] = useState<number>(PRESETS[0].yearsInBusiness);
  const [trucks, setTrucks] = useState<number>(PRESETS[0].ownedTrucks);
  const [lawsuitsRub, setLawsuitsRub] = useState<number>(PRESETS[0].lawsuitsSumRub);
  const [hasFnsFlags, setHasFnsFlags] = useState<boolean>(PRESETS[0].fnsFlags);
  const [completedTrips, setCompletedTrips] = useState<number>(PRESETS[0].completedTripsCount);

  const applyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = PRESETS[index];
    setYears(p.yearsInBusiness);
    setTrucks(p.ownedTrucks);
    setLawsuitsRub(p.lawsuitsSumRub);
    setHasFnsFlags(p.fnsFlags);
    setCompletedTrips(p.completedTripsCount);
  };

  // Trust Score Math based on docs/16-integrations/identity-verification/integration-guide.md
  let ageScore = 0;
  if (years >= 3) ageScore = 25;
  else if (years >= 1) ageScore = 15;
  else if (years >= 0.5) ageScore = 8;

  let fleetScore = 0;
  if (trucks >= 15) fleetScore = 25;
  else if (trucks >= 5) fleetScore = 18;
  else if (trucks >= 1) fleetScore = 10;

  let arbitrationPenalty = 0;
  if (lawsuitsRub > 2000000) arbitrationPenalty = 35;
  else if (lawsuitsRub > 500000) arbitrationPenalty = 20;
  else if (lawsuitsRub > 0) arbitrationPenalty = 8;

  const fnsPenalty = hasFnsFlags ? 30 : 0;

  let platformExperience = 0;
  if (completedTrips >= 50) platformExperience = 25;
  else if (completedTrips >= 10) platformExperience = 15;
  else if (completedTrips >= 1) platformExperience = 5;

  const rawScore = 30 + ageScore + fleetScore + platformExperience - arbitrationPenalty - fnsPenalty;
  const trustScore = Math.max(0, Math.min(100, rawScore));

  let tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'REJECTED';
  let tierColor: string;
  let tierTitle: string;
  let creditLimitRub: number;
  let maxOrderValueRub: number;

  if (trustScore >= 85) {
    tier = 'GOLD';
    tierColor = 'from-amber-500/20 to-yellow-500/10 border-amber-500/50 text-amber-300';
    tierTitle = 'Золотой партнер (Tier Gold)';
    creditLimitRub = 15000000;
    maxOrderValueRub = 50000000;
  } else if (trustScore >= 70) {
    tier = 'SILVER';
    tierColor = 'from-slate-400/20 to-zinc-500/10 border-slate-400/50 text-slate-200';
    tierTitle = 'Проверенный контрагент (Tier Silver)';
    creditLimitRub = 5000000;
    maxOrderValueRub = 15000000;
  } else if (trustScore >= 50) {
    tier = 'BRONZE';
    tierColor = 'from-orange-700/20 to-amber-900/10 border-orange-600/50 text-orange-300';
    tierTitle = 'Базовый доступ (Tier Bronze)';
    creditLimitRub = 0;
    maxOrderValueRub = 3000000;
  } else {
    tier = 'REJECTED';
    tierColor = 'from-rose-600/20 to-red-900/10 border-rose-500/50 text-rose-300';
    tierTitle = 'Блокировка службы безопасности (Rejected)';
    creditLimitRub = 0;
    maxOrderValueRub = 0;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Калькулятор Trust Score & Скоринга СБ (Admin KYC Engine)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Оценка благонадежности контрагента по алгоритмам ФНС, картотеки арбитражных дел (КАД) и истории перевозок.
          </p>
        </div>
      </div>

      {/* Preset Companies */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Тестовые профили организаций:</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={p.name}
              onClick={() => applyPreset(idx)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedPresetIndex === idx
                  ? 'bg-blue-600/15 border-blue-500/60 shadow-md shadow-blue-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span>{p.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">{p.inn}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-7 space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Факторы риска и параметры аудита
          </h4>

          {/* Age in business */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Срок регистрации юрлица (ЕГРЮЛ):</span>
              <span className="font-mono text-blue-400 font-bold">{years} {years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} (+{ageScore} б)</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="10"
              step="0.2"
              value={years}
              onChange={e => setYears(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Owned trucks */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Собственных ТС в реестре (ПТС / Лизинг):</span>
              <span className="font-mono text-blue-400 font-bold">{trucks} машин (+{fleetScore} б)</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={trucks}
              onChange={e => setTrucks(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Lawsuits */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Сумма активных исков в КАД (Ответчик):</span>
              <span className={`font-mono font-bold ${lawsuitsRub > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {lawsuitsRub.toLocaleString('ru-RU')} ₽ (-{arbitrationPenalty} б)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000000"
              step="250000"
              value={lawsuitsRub}
              onChange={e => setLawsuitsRub(parseInt(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Completed Trips */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Безупречно завершенных рейсов на бирже:</span>
              <span className="font-mono text-emerald-400 font-bold">{completedTrips} рейсов (+{platformExperience} б)</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={completedTrips}
              onChange={e => setCompletedTrips(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* FNS check */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-200">Отметки ФНС о недостоверности сведений</div>
                <div className="text-[11px] text-slate-400">Массовый учредитель, недостоверный юридический адрес (-30 баллов)</div>
              </div>
              <input
                type="checkbox"
                checked={hasFnsFlags}
                onChange={e => setHasFnsFlags(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Right: Calculated Trust Score & Tier */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-6 rounded-2xl border bg-gradient-to-br ${tierColor} space-y-4 shadow-xl`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {tier === 'GOLD' ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : tier === 'SILVER' ? <CheckCircle className="w-4 h-4 text-blue-400" /> : tier === 'BRONZE' ? <AlertTriangle className="w-4 h-4 text-orange-400" /> : <ShieldX className="w-4 h-4 text-rose-500" />}
                <span>{tierTitle}</span>
              </span>
            </div>

            {/* Score Big Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black font-mono tracking-tight text-white">{trustScore}</span>
              <span className="text-lg font-bold text-slate-400">/ 100</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  trustScore >= 85 ? 'bg-amber-400' : trustScore >= 70 ? 'bg-blue-400' : trustScore >= 50 ? 'bg-orange-500' : 'bg-rose-500'
                }`}
                style={{ width: `${trustScore}%` }}
              />
            </div>

            {/* Security Rules for this Tier */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                Регламент службы безопасности:
              </span>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Кредитный лимит (постоплата):</span>
                  <span className="font-mono font-bold text-white">{creditLimitRub.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Макс. ценность груза на 1 рейс:</span>
                  <span className="font-mono font-bold text-white">{maxOrderValueRub.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Доступ к опасным грузам (ADR):</span>
                  <span className="font-bold">{tier === 'GOLD' ? 'Да (Полный)' : tier === 'SILVER' ? 'По согласованию' : 'Запрещено'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Условие оплаты:</span>
                  <span className="font-bold">{tier === 'REJECTED' ? 'Заблокирован' : tier === 'BRONZE' ? '100% Предоплата' : 'Постоплата 30 дней / Факторинг'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Антифрод-верификация:</span> При резком росте оборота компании более чем на 300% за 14 дней система автоматически инициирует повторный аудит через Dadata и Контур.Фокус.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
