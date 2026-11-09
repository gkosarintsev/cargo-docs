import React, { useState } from 'react';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Code, Eye, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { getAllDocs } from '../docsCatalog';

interface C4DiagramInfo {
  id: string;
  level: string;
  title: string;
  svgPath: string;
  pumlPath: string;
  description: string;
  keyComponents: string[];
}

const C4_DIAGRAMS: C4DiagramInfo[] = [
  {
    id: 'system-context',
    level: 'C4 Level 1',
    title: 'Системный контекст (System Context)',
    svgPath: '/docs/03-architecture/c4/01-system-context.svg',
    pumlPath: '/docs/03-architecture/c4/01-system-context.puml',
    description: 'Верхнеуровневое окружение платформы: пользователи (грузовладелец, перевозчик, водитель, диспетчер) и внешние системы (TMS, ERP, WMS, GPS провайдеры, ЭДО).',
    keyComponents: [
      'Грузовладельцы & Экспедиторы (Web SPA / API)',
      'Перевозчики & Автопарки (Web & Мобильный кабинет)',
      'Водители (Мобильное приложение водителя с GPS)',
      'Интеграции: 1С / SAP ERP, TMS, GPS Telematics Wialon / Omnicomm',
      'Провайдеры ЭТрН (Госуслуги / Диадок) и Платёжные шлюзы'
    ],
  },
  {
    id: 'containers',
    level: 'C4 Level 2',
    title: 'Контейнерная архитектура (Containers)',
    svgPath: '/docs/03-architecture/c4/02-containers.svg',
    pumlPath: '/docs/03-architecture/c4/02-containers.puml',
    description: 'Декомпозиция платформы: API Gateway (Nginx / Envoy), Модульный монолит (Node.js/Go с DDD-границами), PostgreSQL (транзакции + GIS), Apache Kafka (Outbox / Event Streaming), Redis (кэш сессий и гео-индекс), OpenSearch (поиск грузов), MinIO (S3 документооборот).',
    keyComponents: [
      'API Gateway & Auth (JWT/OAuth2 + Rate Limiting)',
      'Modular Core Monolith (DDD Bounded Contexts: Marketplace, Orders, Fleet, Billing)',
      'GPS High-Throughput Ingestion Engine (UDP/HTTP)',
      'PostgreSQL Cluster (Primary + Read Replicas + PostGIS)',
      'Apache Kafka (Transactional Outbox events & Telemetry stream)',
      'Redis (Геоиндексирование Geohash & быстрый кэш)',
      'OpenSearch (Полнотекстовый поиск грузов и автопарка)'
    ],
  },
  {
    id: 'marketplace',
    level: 'C4 Level 3',
    title: 'Компоненты: Маркетплейс (Marketplace)',
    svgPath: '/docs/03-architecture/c4/03-components/marketplace.svg',
    pumlPath: '/docs/03-architecture/c4/03-components/marketplace.puml',
    description: 'Внутреннее устройство домена биржи: Load Publishing Service, Offer Matching Engine, Counter-Offer Negotiator, Auction & Tender Manager.',
    keyComponents: [
      'Load Publisher (Валидация габаритов, веса, температурного режима)',
      'Smart Matching Engine (Гео-фильтр по радиусу, весогабаритный расчет, скоринг)',
      'Negotiation & Counter-Offers (Торги, фиксация ставки, тайм-аут)',
      'Private Marketplace Controller (Доступ закрытых пулов перевозчиков)'
    ],
  },
  {
    id: 'tracking',
    level: 'C4 Level 3',
    title: 'Компоненты: Трекинг и Геолокация (Tracking)',
    svgPath: '/docs/03-architecture/c4/03-components/tracking.svg',
    pumlPath: '/docs/03-architecture/c4/03-components/tracking.puml',
    description: 'Приём телеметрии сотен тысяч ТС: Raw Telemetry Normalizer, Map-Matching Engine, Geofence Watcher (вход/выход со складов), ETA Prediction Engine.',
    keyComponents: [
      'GPS Receiver Pipeline (Парсинг протоколов EGTS, Wialon IPS, Teltonika)',
      'Geofencing Service (Контроль прибытия на погрузку / разгрузку)',
      'ETA Calculator (Прогноз времени прибытия с учетом пробок и РТО водителя)',
      'WebSocket Telemetry Broadcaster (Стриминг маркерного движения на экран диспетчера)'
    ],
  },
  {
    id: 'transport',
    level: 'C4 Level 3',
    title: 'Компоненты: Исполнение перевозки (Transport Execution)',
    svgPath: '/docs/03-architecture/c4/03-components/transport.svg',
    pumlPath: '/docs/03-architecture/c4/03-components/transport.puml',
    description: 'Жизненный цикл заказа от назначения тягача и водителя до приёмки груза, фиксации актов расхождений и электронного PoD.',
    keyComponents: [
      'Transport Order Coordinator (Конечный автомат статусов заказа)',
      'Fleet Allocator (Проверка доступности тягача, прицепа и ВУ водителя)',
      'Incident & Exception Handler (Фиксация поломок, простоев, задержек)',
      'Proof of Delivery (PoD) Validator (Фото накладных, QR-коды, ЭТрН)'
    ],
  },
];

interface C4ViewerProps {
  onNavigateDoc?: (docPath: string) => void;
}

export const C4Viewer: React.FC<C4ViewerProps> = ({ onNavigateDoc }) => {
  const [selectedId, setSelectedId] = useState<string>('system-context');
  const [zoom, setZoom] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'svg' | 'puml'>('svg');

  const allDocs = getAllDocs();
  const currentDiagram = C4_DIAGRAMS.find(d => d.id === selectedId) || C4_DIAGRAMS[0];

  const svgDoc = allDocs.find(d => d.path === currentDiagram.svgPath);
  const pumlDoc = allDocs.find(d => d.path === currentDiagram.pumlPath);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {currentDiagram.level}
            </span>
            <span className="text-xs text-slate-400">C4 Архитектурная модель</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {currentDiagram.title}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {currentDiagram.description}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start md:self-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('svg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'svg'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Векторная схема (SVG)</span>
          </button>
          <button
            onClick={() => setViewMode('puml')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'puml'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>PlantUML код</span>
          </button>
        </div>
      </div>

      {/* Diagram Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {C4_DIAGRAMS.map((diag) => {
          const isSelected = diag.id === selectedId;
          return (
            <button
              key={diag.id}
              onClick={() => {
                setSelectedId(diag.id);
                setZoom(1);
              }}
              className={`text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500/80 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                {diag.level}
              </div>
              <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                {diag.title.split('(')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Canvas / Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-lg text-slate-300">
          <button
            onClick={handleZoomIn}
            title="Увеличить"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1 font-semibold text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title="Уменьшить"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Сбросить масштаб"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[520px] max-h-[700px] overflow-auto flex items-center justify-center p-6 bg-slate-950/60">
          {viewMode === 'svg' ? (
            svgDoc?.content ? (
              <div
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
                className="max-w-full inline-block bg-white/95 rounded-xl p-4 shadow-xl text-slate-900 select-none"
                dangerouslySetInnerHTML={{ __html: svgDoc.content }}
              />
            ) : (
              <div className="text-center p-12 text-slate-400">
                <Layers className="w-12 h-12 mx-auto text-slate-600 mb-3 animate-pulse" />
                <p>Загрузка векторной диаграммы...</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{currentDiagram.svgPath}</p>
              </div>
            )
          ) : (
            <div className="w-full h-full p-4">
              <pre className="p-4 text-xs font-mono text-emerald-400 bg-slate-900 rounded-xl overflow-auto border border-slate-800 max-h-[560px] leading-relaxed">
                <code>{pumlDoc?.content || '// PlantUML specification not available'}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Component Breakdown Drawer / Footer */}
        <div className="border-t border-slate-800/80 bg-slate-900/70 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Ключевые элементы и ответственность подсистемы
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {currentDiagram.keyComponents.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
            <span>Связано с документами: 03-architecture / adr / c4</span>
            {onNavigateDoc && (
              <button
                onClick={() => onNavigateDoc('/docs/03-architecture/architecture-overview.md')}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
              >
                <span>Читать полный обзор архитектуры</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
