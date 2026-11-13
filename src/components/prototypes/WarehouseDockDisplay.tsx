import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Volume2,
  ArrowRight,
  ShieldAlert,
  User
} from 'lucide-react';

interface DockGate {
  id: number;
  gateNumber: string;
  status: 'AVAILABLE' | 'DOCKING' | 'LOADING' | 'COMPLETED' | 'BLOCKED';
  assignedTruck?: string;
  assignedDriver?: string;
  cargoType?: string;
  remainingMinutes?: number;
}

interface WaitingTruck {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  truckModel: string;
  arrivedTime: string;
  cargo: string;
}

const INITIAL_GATES: DockGate[] = [
  { id: 1, gateNumber: 'Ворота №1', status: 'AVAILABLE' },
  { id: 2, gateNumber: 'Ворота №2', status: 'LOADING', assignedTruck: 'O 892 PP 77', assignedDriver: 'Иванов С.', cargoType: 'Паллеты FMCG', remainingMinutes: 14 },
  { id: 3, gateNumber: 'Ворота №3', status: 'DOCKING', assignedTruck: 'K 104 TX 198', assignedDriver: 'Смирнов Д.', cargoType: 'Напитки (Тент)', remainingMinutes: 45 },
  { id: 4, gateNumber: 'Ворота №4', status: 'COMPLETED', assignedTruck: 'H 550 EE 50', assignedDriver: 'Васильев А.', cargoType: 'Оборудование', remainingMinutes: 0 },
  { id: 5, gateNumber: 'Ворота №5', status: 'AVAILABLE' },
  { id: 6, gateNumber: 'Ворота №6', status: 'LOADING', assignedTruck: 'P 301 AX 77', assignedDriver: 'Ковалев Н.', cargoType: 'Заморозка -18°C', remainingMinutes: 28 },
  { id: 7, gateNumber: 'Ворота №7', status: 'AVAILABLE' },
  { id: 8, gateNumber: 'Ворота №8', status: 'BLOCKED' },
];

const INITIAL_QUEUE: WaitingTruck[] = [
  { id: 'q-1', plateNumber: 'A 742 KX 77', driverName: 'Михаил Соколов', driverPhone: '+7 (916) 450-22-11', truckModel: 'Volvo FH16 (Тент)', arrivedTime: '14:15', cargo: 'Автокомпоненты (18.5т)' },
  { id: 'q-2', plateNumber: 'B 318 ET 198', driverName: 'Сергей Баринов', driverPhone: '+7 (903) 892-74-33', truckModel: 'Scania R500 (Реф)', arrivedTime: '14:28', cargo: 'Молочная продукция (16т)' },
  { id: 'q-3', plateNumber: 'M 994 PP 50', driverName: 'Андрей Морозов', driverPhone: '+7 (921) 112-90-84', truckModel: 'Mercedes Actros', arrivedTime: '14:40', cargo: 'Стройматериалы (20т)' },
];

export const WarehouseDockDisplay: React.FC = () => {
  const [gates, setGates] = useState<DockGate[]>(INITIAL_GATES);
  const [queue, setQueue] = useState<WaitingTruck[]>(INITIAL_QUEUE);
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);

  // Tick down remaining loading times
  useEffect(() => {
    const timer = setInterval(() => {
      setGates(prev =>
        prev.map(g => {
          if (g.status === 'LOADING' && g.remainingMinutes && g.remainingMinutes > 1) {
            return { ...g, remainingMinutes: g.remainingMinutes - 1 };
          } else if (g.status === 'LOADING' && g.remainingMinutes === 1) {
            return { ...g, status: 'COMPLETED', remainingMinutes: 0 };
          }
          return g;
        })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCallTruckToGate = (truck: WaitingTruck, gateId: number) => {
    setGates(prev =>
      prev.map(g => {
        if (g.id === gateId) {
          return {
            ...g,
            status: 'DOCKING',
            assignedTruck: truck.plateNumber,
            assignedDriver: truck.driverName,
            cargoType: truck.cargo,
            remainingMinutes: 40,
          };
        }
        return g;
      })
    );
    setQueue(prev => prev.filter(t => t.id !== truck.id));
    setLastAnnouncement(`Тягач ${truck.plateNumber} (${truck.driverName}) приглашен к Воротам №${gateId}! Отправлено SMS-уведомление.`);
    setTimeout(() => setLastAnnouncement(null), 6000);
  };

  const handleReleaseGate = (gateId: number) => {
    setGates(prev =>
      prev.map(g => {
        if (g.id === gateId) {
          return {
            ...g,
            status: 'AVAILABLE',
            assignedTruck: undefined,
            assignedDriver: undefined,
            cargoType: undefined,
            remainingMinutes: undefined,
          };
        }
        return g;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-emerald-400" />
            <span>Интерактивное табло пандусов и ворот склада (Dock Scheduler & Gate Board)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Диспетчеризация грузового двора, тайминг окон разгрузки (Time Slots) и автоматический вызов тягачей из накопителя.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Свободно: {gates.filter(g => g.status === 'AVAILABLE').length} ворот</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <span>В очереди: {queue.length} ТС</span>
          </span>
        </div>
      </div>

      {/* Announcement Notification */}
      {lastAnnouncement && (
        <div className="p-3 bg-blue-950/80 border border-blue-500/50 rounded-xl text-blue-300 text-xs flex items-center gap-2 animate-fade-in shadow-lg">
          <Volume2 className="w-4 h-4 text-blue-400 shrink-0 animate-bounce" />
          <span className="font-semibold">{lastAnnouncement}</span>
        </div>
      )}

      {/* Main Grid: Gate Board on Left, Yard Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 8 Gates Grid */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Пандусы складского терминала (8 Доков)</span>
            <span className="text-[11px] text-slate-500">Автообновление статусов</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {gates.map(gate => {
              let badgeColor = '';
              let statusLabel = '';

              switch (gate.status) {
                case 'AVAILABLE':
                  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                  statusLabel = 'Свободен';
                  break;
                case 'DOCKING':
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                  statusLabel = 'Постановка ТС';
                  break;
                case 'LOADING':
                  badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                  statusLabel = 'Идет выгрузка';
                  break;
                case 'COMPLETED':
                  badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                  statusLabel = 'Завершено';
                  break;
                case 'BLOCKED':
                  badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                  statusLabel = 'Тех. ремонт';
                  break;
              }

              return (
                <div
                  key={gate.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[170px] ${
                    gate.status === 'AVAILABLE'
                      ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      : gate.status === 'BLOCKED'
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-slate-900/90 border-slate-700 shadow-lg'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{gate.gateNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {gate.assignedTruck ? (
                      <div className="space-y-1">
                        <div className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{gate.assignedTruck}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate">
                          {gate.assignedDriver}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {gate.cargoType}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-slate-500">
                        {gate.status === 'BLOCKED' ? 'Ворота временно заблокированы' : 'Пандус готов к приему ТС'}
                      </div>
                    )}
                  </div>

                  {/* Bottom section of card */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    {gate.remainingMinutes !== undefined && gate.status === 'LOADING' ? (
                      <span className="text-[11px] text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Осталось {gate.remainingMinutes} мин</span>
                      </span>
                    ) : gate.status === 'COMPLETED' ? (
                      <button
                        onClick={() => handleReleaseGate(gate.id)}
                        className="w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                      >
                        Освободить ворота
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">Шлюз герметичен</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Waiting Queue in the Yard */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
            <span>Накопитель / Очередь на КПП ({queue.length})</span>
            <span className="text-[11px] text-slate-500">По времени прибытия</span>
          </div>

          <div className="space-y-2.5">
            {queue.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                Все ожидающие тягачи распределены по пандусам!
              </div>
            ) : (
              queue.map(truck => {
                const firstAvailableGate = gates.find(g => g.status === 'AVAILABLE');

                return (
                  <div
                    key={truck.id}
                    className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-mono text-white">{truck.plateNumber}</div>
                          <div className="text-[11px] text-slate-400">{truck.truckModel}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">Прибыл: {truck.arrivedTime}</span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400">Груз:</span> {truck.cargo}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">{truck.driverName}</span>

                      {firstAvailableGate ? (
                        <button
                          onClick={() => handleCallTruckToGate(truck, firstAvailableGate.id)}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <span>Вызвать к Воротам №{firstAvailableGate.id}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Нет свободных ворот</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick Reset of yard queue */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setGates(INITIAL_GATES);
                  setQueue(INITIAL_QUEUE);
                  setLastAnnouncement(null);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить состояние двора</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
