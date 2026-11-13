import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCheck,
  ShieldAlert,
  Clock,
  PhoneCall,
  Camera,
  Layers
} from 'lucide-react';

export const DriverAppSimulator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedPoints, setQueuedPoints] = useState<number>(0);
  const [syncedRecently, setSyncedRecently] = useState<boolean>(false);
  const [distanceToGateMeters, setDistanceToGateMeters] = useState<number>(650);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [sealNumber, setSealNumber] = useState<string>('PL-883190');
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [isSigned, setIsSigned] = useState<boolean>(false);

  // Canvas ref for finger signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Accumulate points in SQLite queue when offline
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isOnline) {
      interval = setInterval(() => {
        setQueuedPoints(prev => prev + 1);
      }, 2500);
    } else {
      if (queuedPoints > 0) {
        setSyncedRecently(true);
        setQueuedPoints(0);
        const timer = setTimeout(() => setSyncedRecently(false), 4000);
        return () => clearTimeout(timer);
      }
    }
    return () => clearInterval(interval);
  }, [isOnline, queuedPoints]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setIsSigned(true);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSigned(false);
  };

  const handleCheckIn = () => {
    if (distanceToGateMeters > 300) {
      setCheckInError(`Гео-ошибка: вы находитесь в ${distanceToGateMeters}м от склада (допустимо ≤300м). Подъедьте ближе.`);
      setTimeout(() => setCheckInError(null), 4000);
    } else {
      setIsCheckedIn(true);
      setCheckInError(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Description */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>Мобильное рабочее место водителя (Driver Mobile App Simulator)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Симуляция экрана водителя: Offline-First буферизация в SQLite, Geofence валидация прибытия, сенсорная подпись накладной и кнопка SOS.
          </p>
        </div>

        {/* Simulation Toggles */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Сеть GSM:</span>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              isOnline
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-600/20 text-rose-300 border border-rose-500/40 animate-pulse'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>4G Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Глухая зона (Offline)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Phone Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[360px] bg-slate-950 rounded-[44px] p-3.5 border-4 border-slate-700 shadow-2xl relative">
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-20">
              <div className="w-2 h-2 rounded-full bg-slate-800" />
              <div className="w-10 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-slate-900 rounded-[34px] overflow-hidden border border-slate-800 text-white flex flex-col min-h-[640px]">
              {/* Phone Status Bar */}
              <div className="pt-3 px-6 pb-2 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>14:32</span>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Wifi className="w-3 h-3" /> 4G
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <WifiOff className="w-3 h-3" /> Нет сети
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    94% <Battery className="w-3.5 h-3.5 text-slate-300" />
                  </span>
                </div>
              </div>

              {/* Offline sync banner if offline */}
              {!isOnline && (
                <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-1.5 text-[11px] text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Оффлайн: {queuedPoints} точек в SQLite</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono">buffer active</span>
                </div>
              )}

              {/* Online recovery banner */}
              {syncedRecently && (
                <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-3 py-1.5 text-[11px] text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Сеть активна: 100% пакетов синхронизировано</span>
                </div>
              )}

              {/* App Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
                    CP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Рейс #12 • Тент 20т</div>
                    <div className="text-[10px] text-slate-400">Михаил Соколов (Volvo A742KX)</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsSosActive(true)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md shadow-rose-900/50"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>SOS</span>
                </button>
              </div>

              {/* App Body Content */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {/* Active Stop Card */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Точка назначения (Выгрузка)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Окно: до 18:00</span>
                  </div>

                  <div className="text-xs font-bold text-slate-200">
                    ТЛК «Шушары», Складской проезд 4, пандус 12
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                    <span className="text-slate-400">Дистанция по GPS:</span>
                    <span className={`font-mono font-bold ${distanceToGateMeters <= 300 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {distanceToGateMeters} метров
                    </span>
                  </div>
                </div>

                {/* Check-in Status */}
                <div className="space-y-2">
                  {checkInError && (
                    <div className="p-2.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{checkInError}</span>
                    </div>
                  )}

                  {!isCheckedIn ? (
                    <button
                      onClick={handleCheckIn}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] rounded-xl text-xs font-bold text-white shadow-lg shadow-sky-900/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Я прибыл на склад (Check-in)</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold">Прибытие зафиксировано!</div>
                        <div className="text-[10px] text-emerald-400/80">Геозона подтверждена. Назначены ворота #4.</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Proof of Delivery / Signature Block */}
                {isCheckedIn && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Подписание Титула ЭТрН</span>
                      </span>
                      <button
                        onClick={clearSignature}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Очистить</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Распишитесь пальцем в поле ниже для акцепта накладной:
                    </div>

                    <div className="border border-slate-700 rounded-xl bg-slate-900 overflow-hidden relative touch-none">
                      <canvas
                        ref={canvasRef}
                        width={290}
                        height={90}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[90px] cursor-crosshair"
                      />
                      {!isSigned && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] text-slate-600 font-mono">
                          Место для подписи получателя / водителя
                        </div>
                      )}
                    </div>

                    {isSigned && (
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Подпись зафиксирована (ПЭП / ГОСТ хэш)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Phone Bar */}
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex justify-around text-slate-400 text-xs">
                <span className="text-sky-400 font-bold">Маршрут</span>
                <span>Документы</span>
                <span>Профиль</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Driver Simulator Remote Control Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Пульт управления сценарием водителя</span>
            </h4>

            {/* Slider to adjust distance to gate */}
            <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Дистанция от тягача до КПП склада:</span>
                <span className={`font-mono font-bold ${distanceToGateMeters <= 300 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {distanceToGateMeters} м ({distanceToGateMeters <= 300 ? 'Внутри геозоны ≤300м' : 'Снаружи геозоны'})
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1200"
                step="50"
                value={distanceToGateMeters}
                onChange={e => setDistanceToGateMeters(parseInt(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDistanceToGateMeters(150)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  У ворот (150м)
                </button>
                <button
                  onClick={() => setDistanceToGateMeters(280)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  На границе КПП (280м)
                </button>
                <button
                  onClick={() => setDistanceToGateMeters(850)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  На подъезде (850м)
                </button>
              </div>
            </div>

            {/* Offline Specs summary */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block">Как работает Offline-First на реальном устройстве:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Локальная база <code>offline_telemetry_queue</code> в SQLite буферизует до 50 000 точек.</li>
                <li>Каждая координата сохраняет локальный <code>recorded_at</code> по часам GPS-спутника.</li>
                <li>При выходе из туннеля или глухой зоны фоновый воркер пачками по 200 точек выгружает данные через <code>POST /api/v1/telemetry/batch</code>.</li>
                <li>Идемпотентный ключ пачки предотвращает дублирование координат при ретраях.</li>
              </ul>
            </div>

            {/* Reset State */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsCheckedIn(false);
                  setDistanceToGateMeters(650);
                  clearSignature();
                  setIsSosActive(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить симулятор к исходному состоянию</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SOS Alert Modal */}
      {isSosActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white">Экстренный вызов SOS отправлен!</h3>
            <p className="text-xs text-slate-300">
              Координаты тягача <span className="font-mono text-white">57.8502, 34.2014</span> переданы в диспетчерский пульт с наивысшим приоритетом P0. Диспетчер инициирует экстренный вызов по спецканалу.
            </p>

            <button
              onClick={() => setIsSosActive(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Закрыть тревогу
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
