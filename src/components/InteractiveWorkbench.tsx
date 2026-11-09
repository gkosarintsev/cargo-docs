import React, { useState, useEffect } from 'react';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  FileSpreadsheet,
  MapPin,
  Clock,
  Gauge,
  Wifi,
  Navigation,
  Search,
  Filter,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Play,
  Pause,
  ArrowUpRight,
  X,
  Layers
} from 'lucide-react';

interface FleetTrip {
  id: string;
  orderNumber: string;
  driverName: string;
  driverPhone: string;
  truckModel: string;
  plateNumber: string;
  routeFrom: string;
  routeTo: string;
  cargo: string;
  weightTons: number;
  status: 'on_schedule' | 'alert_delay' | 'breakdown';
  lat: number;
  lng: number;
  speedKmH: number;
  eta: string;
  lastTelemetry: string;
  deviationMinutes: number;
  alertReason?: string;
}

const INITIAL_TRIPS: FleetTrip[] = [
  {
    id: 'trip-12',
    orderNumber: 'Рейс #12',
    driverName: 'Михаил Соколов',
    driverPhone: '+7 (916) 450-22-11',
    truckModel: 'Volvo FH16 (Тент)',
    plateNumber: 'A 742 KX 77',
    routeFrom: 'Москва (Склад Юг)',
    routeTo: 'Санкт-Петербург (Шушары)',
    cargo: 'Автозапчасти & Компоненты',
    weightTons: 18.5,
    status: 'on_schedule',
    lat: 57.85,
    lng: 34.20,
    speedKmH: 78,
    eta: '18:45 (в графике)',
    lastTelemetry: '3 сек назад',
    deviationMinutes: 0,
  },
  {
    id: 'trip-14',
    orderNumber: 'Рейс #14',
    driverName: 'Сергей Баринов',
    driverPhone: '+7 (903) 892-74-33',
    truckModel: 'Scania R500 (Рефрижератор)',
    plateNumber: 'B 318 ET 198',
    routeFrom: 'Казань (РЦ)',
    routeTo: 'Нижний Новгород',
    cargo: 'Молочная продукция (+4°C)',
    weightTons: 16.0,
    status: 'on_schedule',
    lat: 56.12,
    lng: 47.25,
    speedKmH: 72,
    eta: '20:15 (в графике)',
    lastTelemetry: '1 сек назад',
    deviationMinutes: 0,
  },
  {
    id: 'trip-15',
    orderNumber: 'Рейс #15',
    driverName: 'Андрей Морозов',
    driverPhone: '+7 (921) 112-90-84',
    truckModel: 'Mercedes-Benz Actros (Изотерм)',
    plateNumber: 'M 994 PP 50',
    routeFrom: 'Екатеринбург',
    routeTo: 'Пермь',
    cargo: 'Промышленное оборудование',
    weightTons: 21.2,
    status: 'on_schedule',
    lat: 57.30,
    lng: 58.40,
    speedKmH: 81,
    eta: '22:30 (в графике)',
    lastTelemetry: '2 сек назад',
    deviationMinutes: 0,
  },
  {
    id: 'trip-18',
    orderNumber: 'Рейс #18',
    driverName: 'Владимир Волков',
    driverPhone: '+7 (985) 662-34-19',
    truckModel: 'DAF XF 105 (Тент)',
    plateNumber: 'O 512 AC 777',
    routeFrom: 'Минск (ТЛЦ)',
    routeTo: 'Смоленск',
    cargo: 'Бытовая химия',
    weightTons: 19.8,
    status: 'on_schedule',
    lat: 54.40,
    lng: 30.50,
    speedKmH: 74,
    eta: '19:10 (в графике)',
    lastTelemetry: '4 сек назад',
    deviationMinutes: 0,
  },
];

export const InteractiveWorkbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'marketplace' | 'specs_comparison'>('dispatcher');
  const [trips, setTrips] = useState<FleetTrip[]>(INITIAL_TRIPS);
  const [selectedTripId, setSelectedTripId] = useState<string>('trip-12');
  const [isAlertMode, setIsAlertMode] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [isTelemetryLive, setIsTelemetryLive] = useState<boolean>(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Counter offer state for marketplace tab
  const [offerBid, setOfferBid] = useState<string>('125000');
  const [offerSent, setOfferSent] = useState<boolean>(false);

  // Trigger alert scenario as defined in docs/20-ui/screen-contracts/dispatcher-board.md State 2
  const toggleAlertMode = (alertActive: boolean) => {
    setIsAlertMode(alertActive);
    if (alertActive) {
      setTrips(prev =>
        prev.map(t =>
          t.id === 'trip-14'
            ? {
                ...t,
                status: 'breakdown',
                speedKmH: 0,
                eta: 'Задержка +140 мин',
                deviationMinutes: 140,
                alertReason: 'Аномальная остановка на трассе М-7 > 2 ч. Датчик давления в контуре охлаждения: Авария!',
              }
            : t
        )
      );
      setSelectedTripId('trip-14');
      setDrawerOpen(true);
    } else {
      setTrips(INITIAL_TRIPS);
      setDrawerOpen(false);
    }
  };

  // Simulate real-time GPS telemetry tick over WebSockets
  useEffect(() => {
    if (!isTelemetryLive) return;

    const interval = setInterval(() => {
      setTrips(prev =>
        prev.map(trip => {
          if (trip.status === 'breakdown') return trip;
          // Slight movement simulation
          const deltaLat = (Math.random() - 0.45) * 0.005;
          const deltaLng = (Math.random() - 0.45) * 0.005;
          const speedFlux = Math.floor(70 + Math.random() * 15);
          return {
            ...trip,
            lat: trip.lat + deltaLat,
            lng: trip.lng + deltaLng,
            speedKmH: speedFlux,
            lastTelemetry: 'только что',
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isTelemetryLive]);

  // Sort trips: alert trips float to the top as specified in contract
  const sortedTrips = [...trips].sort((a, b) => {
    if (a.status === 'breakdown' && b.status !== 'breakdown') return -1;
    if (b.status === 'breakdown' && a.status !== 'breakdown') return 1;
    return 0;
  });

  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  const handleActionClick = (actionName: string) => {
    setActionSuccessMsg(`Действие выполнено: ${actionName} по заказу ${selectedTrip.orderNumber}`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/50 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Contract Engine
            </span>
            <span className="text-xs text-slate-400">docs/20-ui/screen-contracts & docs/06-marketplace</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Интерактивный пульт и полигон контрактов
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-2xl">
            Живая демонстрация спецификаций экранов: поведение карточек при алертах, стриминг телеметрии, картографический трекинг и торги на бирже.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dispatcher'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Диспетчерский пульт (Active Fleet)
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'marketplace'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Биржа & Торги (Negotiation)
          </button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'dispatcher' && (
        <div className="space-y-4">
          {/* State Controls Bar per UI Contract */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-300">Сценарий состояния:</span>
              <button
                onClick={() => toggleAlertMode(false)}
                className={`px-3 py-1 rounded-lg border font-medium transition-colors ${
                  !isAlertMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                1. Штатный режим (В графике)
              </button>
              <button
                onClick={() => toggleAlertMode(true)}
                className={`px-3 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                  isAlertMode
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold shadow-md shadow-rose-950'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                2. Экстренная ситуация (Алерт #14)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-400 mr-2">
                <Wifi className={`w-3.5 h-3.5 ${isTelemetryLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>GPS WebSocket: {isTelemetryLive ? 'Стриминг 3с' : 'Пауза'}</span>
              </div>
              <button
                onClick={() => setIsTelemetryLive(!isTelemetryLive)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1"
              >
                {isTelemetryLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isTelemetryLive ? 'Пауза' : 'Пуск'}</span>
              </button>
            </div>
          </div>

          {/* Main Dispatcher Split Layout: Fleet List on Left, Map & Telemetry on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Trip Cards */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>Список активных рейсов ({trips.length})</span>
                <span className="text-[11px] text-slate-500">Автосортировка по приоритету</span>
              </div>

              <div className="space-y-2.5">
                {sortedTrips.map(trip => {
                  const isSelected = trip.id === selectedTripId;
                  const isCritical = trip.status === 'breakdown';

                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        if (isCritical) setDrawerOpen(true);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                        isCritical
                          ? isSelected
                            ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500'
                            : 'bg-rose-950/20 border-rose-800/80 hover:bg-rose-950/30'
                          : isSelected
                          ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/30'
                          : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      {isCritical && (
                        <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 animate-pulse" />
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {trip.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCritical
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isCritical ? '⚠️ АЛЕРИТ: ПРОСТОЙ' : 'В ГРАФИКЕ'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{trip.plateNumber}</span>
                      </div>

                      <div className="text-xs text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{trip.routeFrom} → {trip.routeTo}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-slate-500" />
                          <span>{trip.speedKmH} км/ч</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className={isCritical ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                            {trip.eta}
                          </span>
                        </div>
                      </div>

                      {trip.alertReason && (
                        <div className="mt-2.5 p-2 rounded bg-rose-900/30 border border-rose-800/60 text-[11px] text-rose-200">
                          {trip.alertReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Map & Selected Telemetry Panel */}
            <div className="lg:col-span-7 space-y-4">
              {/* Simulated Interactive Vector Map */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
                <div className="p-3 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">Карта телеметрии: Трассы М-10, М-7, М-12</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> В графике
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" /> Алерт
                    </span>
                  </div>
                </div>

                {/* Vector Map Canvas */}
                <div className="relative h-72 md:h-80 w-full bg-[#0a1120] overflow-hidden select-none">
                  {/* Grid Lines */}
                  <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Freight Corridors (Roads) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    {/* Highway M-10 */}
                    <path d="M 60 70 Q 180 140 320 220" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeDasharray="6 4" />
                    {/* Highway M-7 */}
                    <path d="M 120 240 Q 340 180 540 130" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeDasharray="6 4" />
                    {/* Highway M-1 */}
                    <path d="M 40 190 Q 200 180 400 120" fill="none" stroke="#1e3a8a" strokeWidth="4" strokeDasharray="6 4" />
                  </svg>

                  {/* City Hub Markers */}
                  <div className="absolute top-14 left-10 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>Санкт-Петербург</span>
                  </div>
                  <div className="absolute top-44 left-44 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-bold text-slate-200">МОСКВА</span>
                  </div>
                  <div className="absolute top-28 right-24 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>Казань</span>
                  </div>

                  {/* Moving Trucks on Map */}
                  {trips.map(trip => {
                    const isSelected = trip.id === selectedTripId;
                    const isAlert = trip.status === 'breakdown';

                    // Normalized positions on visual container
                    const posX = trip.id === 'trip-12' ? '28%' : trip.id === 'trip-14' ? '65%' : trip.id === 'trip-15' ? '82%' : '48%';
                    const posY = trip.id === 'trip-12' ? '38%' : trip.id === 'trip-14' ? '54%' : trip.id === 'trip-15' ? '68%' : '46%';

                    return (
                      <div
                        key={trip.id}
                        onClick={() => {
                          setSelectedTripId(trip.id);
                          if (isAlert) setDrawerOpen(true);
                        }}
                        style={{ left: posX, top: posY }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700 z-10 ${
                          isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                        }`}
                      >
                        <div className="relative group">
                          {/* Pulsing beacon if alert or selected */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-lg transition-transform ${
                              isAlert
                                ? 'bg-rose-600 text-white border-rose-300 animate-bounce shadow-rose-600/50'
                                : isSelected
                                ? 'bg-blue-600 text-white border-white shadow-blue-600/50'
                                : 'bg-emerald-600 text-white border-emerald-300 shadow-emerald-900/50'
                            }`}
                          >
                            <Truck className="w-4 h-4" />
                          </div>

                          {/* Hover tooltip label */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-900/95 border border-slate-700 text-white text-[10px] rounded shadow-xl whitespace-nowrap opacity-90 group-hover:opacity-100 font-mono">
                            {trip.orderNumber} ({trip.speedKmH} км/ч)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Trip Quick Details */}
                <div className="p-4 bg-slate-900/80 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{selectedTrip.orderNumber}</span>
                        <span className="text-xs text-slate-400">({selectedTrip.truckModel})</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Водитель: <span className="font-semibold text-white">{selectedTrip.driverName}</span> • {selectedTrip.driverPhone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedTrip.status === 'breakdown' && (
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-rose-950 animate-pulse"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Панель быстрого реагирования</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Груз & Тоннаж</div>
                      <div className="font-medium text-slate-200 mt-0.5 truncate">{selectedTrip.cargo}</div>
                      <div className="text-[11px] text-slate-400">{selectedTrip.weightTons} т</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Скорость & GPS</div>
                      <div className="font-medium text-slate-200 mt-0.5">{selectedTrip.speedKmH} км/ч</div>
                      <div className="text-[11px] text-slate-400 font-mono">{selectedTrip.lat.toFixed(2)}N, {selectedTrip.lng.toFixed(2)}E</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Прогноз ETA</div>
                      <div className={`font-semibold mt-0.5 ${selectedTrip.status === 'breakdown' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {selectedTrip.eta}
                      </div>
                      <div className="text-[11px] text-slate-400">Телеметрия: {selectedTrip.lastTelemetry}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Госномер ТС</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedTrip.plateNumber}</div>
                      <div className="text-[11px] text-slate-400">Трекер Wialon IPS</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Drawer per Contract (открывается при клике на алерт) */}
          {drawerOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-700 p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="font-bold text-white text-base">Инцидент {selectedTrip.orderNumber}</span>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 space-y-1">
                  <div className="font-bold uppercase tracking-wider text-[11px] text-rose-300">
                    Аномальная задержка рейса
                  </div>
                  <p>{selectedTrip.alertReason || 'Остановка на трассе без движения более 120 минут.'}</p>
                </div>

                <div className="text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                    Параметры инцидента:
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Водитель:</span>
                    <span className="font-medium text-white">{selectedTrip.driverName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Телефон:</span>
                    <span className="font-mono text-blue-400">{selectedTrip.driverPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Координаты:</span>
                    <span className="font-mono text-slate-200">56.12 N, 47.25 E (Трасса М-7)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Груз:</span>
                    <span className="text-white">{selectedTrip.cargo}</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Кнопки быстрого реагирования (По контракту):
                  </div>

                  <button
                    onClick={() => handleActionClick('Экстренный звонок водителю')}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Звонок водителю ({selectedTrip.driverPhone})</span>
                  </button>

                  <button
                    onClick={() => handleActionClick('Назначение резервного тягача')}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Вызвать резервное ТС из ближайшего парка</span>
                  </button>

                  <button
                    onClick={() => handleActionClick('Формирование электронного акта простоя')}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Сформировать Акт простоя (ЭТрН)</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
                Диспетчерский пульт • CargoDocs Platform v1.0
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-blue-400" />
              <input
                type="text"
                readOnly
                value="Маршрут: Москва → Екатеринбург • Тент / Рефрижератор 20т"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 w-80 max-w-full font-medium"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Smart Matching Engine: 3 подходящих груза найдено</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Load Card 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    MATCH: 98%
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">130 000 ₽</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Груз #L-9042: Кондитерские изделия</h4>
                <p className="text-xs text-slate-400 mb-3">Москва (Север) → Екатеринбург (РЦ)</p>

                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Вес/Объем:</span>
                    <span>19.5 т / 82 м³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Погрузка:</span>
                    <span>Завтра, 08:00–12:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Тип кузова:</span>
                    <span>Изотерм / Реф (+15°C)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Оплата:</span>
                    <span>5 б/д с НДС (БСП)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={offerBid}
                    onChange={(e) => setOfferBid(e.target.value)}
                    className="w-28 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white text-right"
                  />
                  <span className="text-xs text-slate-400">₽</span>
                  <button
                    onClick={() => {
                      setOfferSent(true);
                      setTimeout(() => setOfferSent(false), 3000);
                    }}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    {offerSent ? 'Предложение отправлено!' : 'Встречное предложение'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Согласно ADR-0010 & docs/06-marketplace/counter-offers
                </p>
              </div>
            </div>

            {/* Load Card 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    MATCH: 92%
                  </span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">115 000 ₽</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Груз #L-9045: Строительные смеси</h4>
                <p className="text-xs text-slate-400 mb-3">Ногинск → Пермь</p>

                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Вес/Объем:</span>
                    <span>20.0 т / 76 м³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Погрузка:</span>
                    <span>12.11, 10:00–18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Тип кузова:</span>
                    <span>Тент (задняя/боковая)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Оплата:</span>
                    <span>Предоплата 30%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleActionClick('Бронирование груза L-9045')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Забрать по фиксированной ставке</span>
                </button>
              </div>
            </div>

            {/* Load Card 3 (Private Marketplace) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/30 to-slate-900 border border-purple-800/40 hover:border-purple-600/60 transition-all shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    🔒 ПРИВАТНЫЙ ПУЛ (ТЕНДЕР)
                  </span>
                  <span className="font-mono text-purple-300 font-bold text-sm">Торги до 17:00</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Груз #T-102: Ритейл FMCG сеть</h4>
                <p className="text-xs text-slate-400 mb-3">Чехов → Екатеринбург (Ежедневно)</p>

                <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Регулярность:</span>
                    <span>7 рейсов в неделю</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Требование:</span>
                    <span>GPS интеграция + ЭТрН</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Рейтинг участника:</span>
                    <span>Не ниже 4.85 ★</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleActionClick('Подача заявки на тендер T-102')}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Подать заявку в приватный пул</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
