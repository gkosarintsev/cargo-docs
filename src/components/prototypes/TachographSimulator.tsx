import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Play,
  Pause,
  FastForward,
  Coffee,
  Wrench,
  Navigation,
  Info
} from 'lucide-react';

type TachographMode = 'DRIVING' | 'WORK' | 'AVAILABILITY' | 'REST';

export const TachographSimulator: React.FC = () => {
  const [mode, setMode] = useState<TachographMode>('DRIVING');
  const [speedKmh, setSpeedKmh] = useState<number>(76);
  // Seconds elapsed in current continuous driving period (4h 30m = 16200 sec)
  // Default to 4h 15m (15300 sec) so user is 15 min away from limit
  const [continuousDriveSec, setContinuousDriveSec] = useState<number>(15300);
  const [dailyDriveSec, setDailyDriveSec] = useState<number>(27900); // 7h 45m (limit 9h = 32400 sec)
  const [restBreakSec, setRestBreakSec] = useState<number>(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(true);
  const [dddReportGenerated, setDddReportGenerated] = useState<boolean>(false);

  // Tick simulation
  useEffect(() => {
    if (!isSimulationRunning) return;

    const timer = setInterval(() => {
      if (mode === 'DRIVING') {
        setContinuousDriveSec(prev => prev + 10);
        setDailyDriveSec(prev => prev + 10);
      } else if (mode === 'REST') {
        setRestBreakSec(prev => {
          const next = prev + 30;
          if (next >= 2700) { // 45 minutes = 2700 sec
            setContinuousDriveSec(0); // Reset continuous driving timer!
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulationRunning, mode]);

  // Formatter mm:ss or hh:mm
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isViolation = continuousDriveSec > 16200; // > 4h 30m
  const isDailyWarning = dailyDriveSec > 32400; // > 9h 00m

  const handleFastForward = (minutes: number) => {
    const addSec = minutes * 60;
    if (mode === 'DRIVING') {
      setContinuousDriveSec(prev => prev + addSec);
      setDailyDriveSec(prev => prev + addSec);
    } else if (mode === 'REST') {
      setRestBreakSec(prev => {
        const next = prev + addSec;
        if (next >= 2700) {
          setContinuousDriveSec(0);
        }
        return next;
      });
    }
  };

  const handleStartRest = () => {
    setMode('REST');
    setSpeedKmh(0);
    setRestBreakSec(0);
  };

  const handleStartDriving = () => {
    setMode('DRIVING');
    setSpeedKmh(78);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Симулятор цифрового тахографа (СКЗИ / ЕСТР) & Контроль РТО</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Контроль норм Приказа Минтранса РФ № 424: непрерывное управление до 04:30, обязательный отдых 45 мин, суточный лимит 9 часов.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulationRunning(!isSimulationRunning)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            {isSimulationRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSimulationRunning ? 'Пауза симуляции' : 'Продолжить'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tachograph In-Cabin Device Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-2xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-black rounded-3xl p-5 border-4 border-zinc-700 shadow-2xl space-y-4">
            {/* Device Brand Header */}
            <div className="flex items-center justify-between text-zinc-400 text-xs border-b border-zinc-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-widest text-white text-sm">DTCO 4.1</span>
                <span className="px-1.5 py-0.5 bg-blue-600/30 text-blue-300 text-[10px] font-mono rounded border border-blue-500/40">СКЗИ НКМ</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>СЛОТ 1: СОКОЛОВ М.И.</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Retro Monochrome LCD Display */}
            <div className={`p-4 rounded-xl border-2 transition-all font-mono select-none ${
              isViolation
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-lg shadow-red-900/50 animate-pulse'
                : 'bg-[#1b2b1a] border-[#2f4f2e] text-[#55ea48] shadow-inner'
            }`}>
              {/* LCD Top Line */}
              <div className="flex items-center justify-between text-xs border-b border-current/20 pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {mode === 'DRIVING' ? '🚗 ВОЖДЕНИЕ' : mode === 'WORK' ? '⚒️ РАБОТА' : mode === 'AVAILABILITY' ? '⏳ ГОТОВНОСТЬ' : '🛏️ ОТДЫХ'}
                  </span>
                </div>
                <div className="text-sm font-bold tracking-wider">
                  {speedKmh} км/ч
                </div>
              </div>

              {/* LCD Center Big Numbers */}
              <div className="py-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] opacity-80 uppercase block">Непрерывный ход (Лимит 04:30):</span>
                  <div className="text-3xl font-black tracking-wider">
                    {formatTime(continuousDriveSec)}
                  </div>
                  {isViolation && (
                    <span className="text-[11px] font-bold text-red-300 block">
                      ⚠️ НАРУШЕНИЕ РТО! СТОЯНКА 45 МИН!
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] opacity-80 uppercase block">Суточное вождение (Лимит 09:00):</span>
                  <div className="text-3xl font-black tracking-wider">
                    {formatTime(dailyDriveSec)}
                  </div>
                  {isDailyWarning && (
                    <span className="text-[11px] font-bold text-red-300 block">
                      ⚠️ ЛИМИТ ДНЯ ИСЧЕРПАН!
                    </span>
                  )}
                </div>
              </div>

              {/* LCD Bottom Status Line */}
              <div className="pt-2 border-t border-current/20 flex items-center justify-between text-[11px]">
                <span>Отдых: {formatTime(restBreakSec)} / 00:45:00</span>
                <span>Калибровка: ГОСТ Р 53831-2010</span>
              </div>
            </div>

            {/* Physical Hardware Buttons on Tachograph Panel */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              <button
                onClick={handleStartDriving}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                  mode === 'DRIVING'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <span>🚗 1</span>
                <span className="text-[10px]">Вождение</span>
              </button>
              <button
                onClick={() => { setMode('WORK'); setSpeedKmh(0); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                  mode === 'WORK'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <span>⚒️ 2</span>
                <span className="text-[10px]">Работа</span>
              </button>
              <button
                onClick={() => { setMode('AVAILABILITY'); setSpeedKmh(0); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                  mode === 'AVAILABILITY'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <span>⏳ 3</span>
                <span className="text-[10px]">Ожидание</span>
              </button>
              <button
                onClick={handleStartRest}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                  mode === 'REST'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <span>🛏️ 4</span>
                <span className="text-[10px]">Отдых 45м</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Simulation Controls & Inspection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FastForward className="w-4 h-4 text-sky-400" />
              <span>Тестирование сценариев нарушения РТО</span>
            </h4>

            {/* Quick Fast Forward Buttons */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400">Быстрая промотка времени:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleFastForward(15)}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-200 font-medium"
                >
                  +15 минут
                </button>
                <button
                  onClick={() => handleFastForward(30)}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-200 font-medium"
                >
                  +30 минут
                </button>
                <button
                  onClick={() => handleFastForward(45)}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-200 font-medium"
                >
                  +45 минут
                </button>
              </div>
            </div>

            {/* Violation Alert Box if exceeded */}
            {isViolation && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-xs text-rose-200 space-y-2 animate-fade-in shadow-xl">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Превышен норматив Приказа Минтранса РФ № 424!</span>
                </div>
                <p className="text-[11px] text-rose-300/90 leading-relaxed">
                  Непрерывное управление ТС превысило 4 часа 30 минут без специального перерыва.
                </p>
                <div className="p-2 bg-black/40 rounded-xl text-[10px] font-mono text-rose-300 space-y-1">
                  <div>• Штраф на водителя (ст. 11.23 КоАП РФ): до 2 000 ₽</div>
                  <div>• Штраф на организацию: до 50 000 ₽</div>
                  <div>• Диспетчер получил P1 алерт на пульт мониторинга</div>
                </div>
              </div>
            )}

            {/* Download/Inspect DDD file */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setDddReportGenerated(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <FileText className="w-4 h-4" />
                <span>Считать и проанализировать .ddd файл карты</span>
              </button>

              {dddReportGenerated && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs animate-fade-in font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Карта: M.Sokolov_20240320.ddd</span>
                    <span className="text-emerald-400">CRC-16 OK</span>
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>Секция EF 0x0504 (Activity Data): 14 записей</div>
                    <div>Блок СКЗИ: НКМ-2.11 № 918230192840</div>
                    <div>Инспекция ГИБДД: Готов для передачи в АСУ Тахографический Контроль</div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setContinuousDriveSec(15300);
                  setDailyDriveSec(27900);
                  setRestBreakSec(0);
                  setMode('DRIVING');
                  setSpeedKmh(76);
                  setDddReportGenerated(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить к 04:15</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
