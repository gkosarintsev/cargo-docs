import React, { useState } from 'react';
import { getAllDocs, DocItem } from '../docsCatalog';
import { MarkdownRenderer } from './MarkdownRenderer';
import { CheckCircle2, ShieldCheck, Database, Search, ArrowRight, Zap, FileCode, Check } from 'lucide-react';

interface AdrExplorerProps {
  onNavigateDoc?: (docPath: string) => void;
}

export const AdrExplorer: React.FC<AdrExplorerProps> = ({ onNavigateDoc }) => {
  const [selectedAdrPath, setSelectedAdrPath] = useState<string>(
    '/docs/03-architecture/adr/0001-architecture-style.md'
  );
  const [filterTopic, setFilterTopic] = useState<string>('all');

  const allDocs = getAllDocs();
  const adrDocs = allDocs.filter(d => d.path.includes('/docs/03-architecture/adr/') && !d.path.includes('template'));

  const filteredAdrs = adrDocs.filter(adr => {
    if (filterTopic === 'all') return true;
    if (filterTopic === 'storage' && (adr.path.includes('postgresql') || adr.path.includes('object-storage') || adr.path.includes('cache'))) return true;
    if (filterTopic === 'streaming' && (adr.path.includes('event-streaming') || adr.path.includes('outbox') || adr.path.includes('idempotency'))) return true;
    if (filterTopic === 'matching' && (adr.path.includes('marketplace') || adr.path.includes('search') || adr.path.includes('gps'))) return true;
    if (filterTopic === 'platform' && (adr.path.includes('architecture-style') || adr.path.includes('multi-tenancy') || adr.path.includes('deployment') || adr.path.includes('auth') || adr.path.includes('observability') || adr.path.includes('api-style'))) return true;
    return true;
  });

  const currentAdr = adrDocs.find(d => d.path === selectedAdrPath) || adrDocs[0];

  return (
    <div className="space-y-6">
      {/* ADR Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              15 Принятых ADR
            </span>
            <span className="text-xs text-slate-400">Architecture Decision Records</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Архитектурный реестр решений (ADR)
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-300 max-w-2xl">
            Строго обоснованные технологические решения: почему выбран Modular Monolith, PostgreSQL, Apache Kafka, Outbox паттерн и распределенная идемпотентность.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setFilterTopic('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Все (15)
          </button>
          <button
            onClick={() => setFilterTopic('platform')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === 'platform' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Платформа & Монолит
          </button>
          <button
            onClick={() => setFilterTopic('storage')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === 'storage' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Базы & Кэш
          </button>
          <button
            onClick={() => setFilterTopic('streaming')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === 'streaming' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kafka & Outbox
          </button>
          <button
            onClick={() => setFilterTopic('matching')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === 'matching' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Матчинг & GPS
          </button>
        </div>
      </div>

      {/* Main split: ADR navigation grid / list on left, rendered ADR on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: ADR Cards */}
        <div className="lg:col-span-4 space-y-2 max-h-[800px] overflow-y-auto pr-1">
          {filteredAdrs.map(adr => {
            const isSelected = adr.path === selectedAdrPath;
            const numberMatch = adr.path.match(/(\d{4})/);
            const num = numberMatch ? numberMatch[1] : 'ADR';

            return (
              <button
                key={adr.path}
                onClick={() => setSelectedAdrPath(adr.path)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    ADR-{num}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    <Check className="w-2.5 h-2.5" /> Accepted
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {adr.title.replace(/^ADR-\d{4}:\s*/, '')}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {adr.path.replace(/^\/docs\//, '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active ADR Content */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-xl">
          {currentAdr && (
            <div>
              <div className="mb-4 pb-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{currentAdr.path}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Архитектурный стандарт платформы
                </span>
              </div>
              <MarkdownRenderer content={currentAdr.content} onNavigateDoc={onNavigateDoc} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
