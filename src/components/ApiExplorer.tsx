import React, { useState } from 'react';
import { getAllDocs } from '../docsCatalog';
import { Code, Send, Copy, Check, ExternalLink, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  tags?: string[];
  description?: string;
  parameters?: string[];
  responseCode?: string;
}

const SPEC_DESCRIPTIONS: Record<string, { title: string; desc: string; domain: string }> = {
  'loads.yaml': {
    title: 'Loads API (Биржа грузов)',
    desc: 'Публикация, поиск по радиусу и характеристикам кузова, бронирование грузов.',
    domain: 'Logistics Marketplace',
  },
  'offers.yaml': {
    title: 'Offers & Negotiations API (Торги)',
    desc: 'Подача предложений, встречные ставки (Counter-Offers), аукционы и закрытие сделки.',
    domain: 'Logistics Marketplace',
  },
  'orders.yaml': {
    title: 'Transport Orders API (Заказы)',
    desc: 'Управление жизненным циклом транспортного заказа: от назначения ТС до PoD.',
    domain: 'Transport Execution',
  },
  'tracking.yaml': {
    title: 'Tracking & Telemetry API (GPS)',
    desc: 'Приём телеметрии, расчёт ETA, контроль выхода из геозон погрузки/разгрузки.',
    domain: 'Real-Time Visibility',
  },
  'vehicles.yaml': {
    title: 'Fleet & Vehicles API (Автопарк)',
    desc: 'Реестр тягачей, полуприцепов, водителей, калибровка датчиков и расписание ТО.',
    domain: 'Fleet Management',
  },
  'documents.yaml': {
    title: 'e-Documents API (ЭТрН & PoD)',
    desc: 'Электронный документооборот, ЭТрН, акты расхождений, электронные подписи (КЭП).',
    domain: 'Documents & Compliance',
  },
  'organizations.yaml': {
    title: 'Organizations & Trust API (Компании)',
    desc: 'Профиль компании, верификация по ИНН/ОГРН, расчет скоринга надежности и рейтинг.',
    domain: 'Trust Network',
  },
  'shipments.yaml': {
    title: 'Shipments API (Партии груза)',
    desc: 'Учет грузовых мест, паллеты, температурные режимы, опасные грузы (ADR).',
    domain: 'Transport Execution',
  },
  'webhooks.yaml': {
    title: 'Webhooks & Events API (Интеграции)',
    desc: 'Асинхронные события для 1C, SAP TMS, WMS складов и внешних брокеров.',
    domain: 'Integration Platform',
  },
};

export const ApiExplorer: React.FC = () => {
  const [selectedSpec, setSelectedSpec] = useState<string>('loads.yaml');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const allDocs = getAllDocs();
  const openApiDocs = allDocs.filter(d => d.path.includes('/docs/14-api/openapi/'));

  const currentDoc = openApiDocs.find(d => d.path.endsWith(selectedSpec)) || openApiDocs[0];
  const specMeta = SPEC_DESCRIPTIONS[selectedSpec] || {
    title: selectedSpec,
    desc: 'Спецификация OpenAPI 3.0',
    domain: 'API & Контракты',
  };

  // Simple parser to extract paths and methods from raw YAML
  const endpoints: Endpoint[] = [];
  if (currentDoc) {
    const lines = currentDoc.content.split('\n');
    let currentPath = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Path match: e.g. "  /api/v1/loads:" or "/loads:"
      const pathMatch = line.match(/^\s*(\/[a-zA-Z0-9_\-\/{}:]+):\s*$/);
      if (pathMatch) {
        currentPath = pathMatch[1];
        continue;
      }

      // Method match: e.g. "    get:" or "    post:"
      const methodMatch = line.match(/^\s*(get|post|put|delete|patch):\s*$/i);
      if (methodMatch && currentPath) {
        const method = methodMatch[1].toUpperCase() as Endpoint['method'];
        let summary = '';
        let description = '';

        // Look ahead for summary or description
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];
          if (/^\s*(get|post|put|delete|patch):/i.test(nextLine) || /^\s*\/[a-zA-Z0-9_\-\/{}:]+:/.test(nextLine)) {
            break;
          }
          const sumMatch = nextLine.match(/summary:\s*(['"]?)(.*?)\1\s*$/);
          if (sumMatch) summary = sumMatch[2];
          const descMatch = nextLine.match(/description:\s*(['"]?)(.*?)\1\s*$/);
          if (descMatch && !description) description = descMatch[2];
        }

        endpoints.push({
          method,
          path: currentPath,
          summary: summary || `${method} ${currentPath}`,
          description: description || 'Спецификация метода согласно OpenAPI контракту',
        });
      }
    }
  }

  const filteredEndpoints = endpoints.filter(ep => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return ep.path.toLowerCase().includes(q) || ep.summary.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q);
  });

  const getMethodBadgeColor = (method: Endpoint['method']) => {
    switch (method) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'PATCH': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DELETE': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  const handleCopySpec = () => {
    if (currentDoc) {
      navigator.clipboard.writeText(currentDoc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              OpenAPI 3.0 & REST
            </span>
            <span className="text-xs text-slate-400">{specMeta.domain}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {specMeta.title}
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-2xl">
            {specMeta.desc}
          </p>
        </div>

        <button
          onClick={handleCopySpec}
          className="self-start md:self-center flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors shadow-md"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">YAML скопирован!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Копировать OpenAPI YAML</span>
            </>
          )}
        </button>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(SPEC_DESCRIPTIONS).map((filename) => {
          const isSelected = selectedSpec === filename;
          const info = SPEC_DESCRIPTIONS[filename];
          return (
            <button
              key={filename}
              onClick={() => {
                setSelectedSpec(filename);
                setSearchFilter('');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20 font-semibold'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>{info.title.split('(')[0]}</div>
              <div className="text-[10px] opacity-75 font-mono">{filename}</div>
            </button>
          );
        })}
      </div>

      {/* Search within endpoints */}
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <input
          type="text"
          placeholder="Фильтр эндпоинтов по пути или названию..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 w-80 max-w-full focus:outline-none focus:border-sky-500"
        />
        <span className="text-slate-400">
          Найдено эндпоинтов: <strong className="text-white">{filteredEndpoints.length}</strong>
        </span>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {filteredEndpoints.length > 0 ? (
          filteredEndpoints.map((ep, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all shadow-md space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${getMethodBadgeColor(ep.method)}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs md:text-sm font-semibold text-white">
                    {ep.path}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {ep.summary}
                </span>
              </div>
              {ep.description && ep.description !== ep.summary && (
                <p className="text-xs text-slate-400 pl-1">{ep.description}</p>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            Эндпоинты не найдены. Вы можете просмотреть исходный YAML ниже.
          </div>
        )}
      </div>

      {/* Raw YAML collapsible section */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="font-mono text-slate-300">Исходная спецификация: /docs/14-api/openapi/{selectedSpec}</span>
          <span className="text-[11px] text-slate-500 font-mono">OpenAPI 3.0.3</span>
        </div>
        <pre className="p-4 text-xs font-mono text-slate-300 max-h-96 overflow-auto leading-relaxed">
          <code>{currentDoc?.content}</code>
        </pre>
      </div>
    </div>
  );
};
