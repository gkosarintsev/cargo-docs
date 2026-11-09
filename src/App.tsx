import React, { useState, useMemo } from 'react';
import {
  getCategoriesWithDocs,
  getAllDocs,
  DocItem,
  CATEGORIES_META
} from './docsCatalog';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { C4Viewer } from './components/C4Viewer';
import { AdrExplorer } from './components/AdrExplorer';
import { InteractiveWorkbench } from './components/InteractiveWorkbench';
import { ApiExplorer } from './components/ApiExplorer';
import {
  BookOpen,
  Layers,
  FileCode,
  Activity,
  Code,
  Search,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Truck,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Compass,
  FileText,
  Boxes,
  ShoppingBag,
  Cpu,
  Server,
  Layout,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

type MainTab = 'docs' | 'c4' | 'adr' | 'workbench' | 'api';

export default function App() {
  const categories = useMemo(() => getCategoriesWithDocs(), []);
  const allDocs = useMemo(() => getAllDocs(), []);

  const [activeTab, setActiveTab] = useState<MainTab>('docs');
  const [selectedDocPath, setSelectedDocPath] = useState<string>('/docs/README.md');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    '00': true,
    '01': true,
    '03': true,
    '20': true,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Find active doc
  const currentDoc = useMemo(() => {
    return allDocs.find(d => d.path === selectedDocPath) || allDocs[0];
  }, [allDocs, selectedDocPath]);

  // Next / Previous navigation
  const currentDocIndex = useMemo(() => {
    return allDocs.findIndex(d => d.path === selectedDocPath);
  }, [allDocs, selectedDocPath]);

  const prevDoc = currentDocIndex > 0 ? allDocs[currentDocIndex - 1] : null;
  const nextDoc = currentDocIndex < allDocs.length - 1 ? allDocs[currentDocIndex + 1] : null;

  // Toggle category collapse
  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allDocs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.path.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [allDocs, searchQuery]);

  // Handle navigating from links inside markdown
  const handleNavigateDoc = (targetPath: string) => {
    // If relative path like 01-product-and-domain/product-overview.md
    let fullPath = targetPath;
    if (!targetPath.startsWith('/docs/')) {
      if (targetPath.startsWith('/')) {
        fullPath = `/docs${targetPath}`;
      } else {
        fullPath = `/docs/${targetPath}`;
      }
    }
    // Clean any anchors
    fullPath = fullPath.split('#')[0];

    const match = allDocs.find(d => d.path === fullPath || d.path.endsWith(targetPath));
    if (match) {
      setSelectedDocPath(match.path);
      setActiveTab('docs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => {
                setSelectedDocPath('/docs/README.md');
                setActiveTab('docs');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm md:text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>CargoDocs</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Enterprise
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                  Техническая архитектура логистической платформы
                </div>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'docs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Документация</span>
            </button>

            <button
              onClick={() => setActiveTab('c4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'c4'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Архитектура & C4</span>
            </button>

            <button
              onClick={() => setActiveTab('adr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'adr'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>ADR Решения (15)</span>
            </button>

            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'workbench'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Интерактивный пульт</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-sky-400" />
              <span>OpenAPI Спеки</span>
            </button>
          </nav>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по 90+ документам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Instant Search Dropdown */}
            {searchQuery && (
              <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800/60">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                  Результаты поиска ({searchResults.length})
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button
                      key={result.path}
                      onClick={() => {
                        setSelectedDocPath(result.path);
                        setActiveTab('docs');
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-800/80 rounded-xl transition-colors group"
                    >
                      <div className="text-xs font-semibold text-white group-hover:text-blue-400">
                        {result.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        {result.path.replace(/^\/docs\//, '')}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Ничего не найдено по запросу «{searchQuery}»
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 py-2 px-1 text-[11px]">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'docs' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Документы</span>
          </button>
          <button
            onClick={() => setActiveTab('c4')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'c4' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            <Layers className="w-4 h-4" />
            <span>C4 Модель</span>
          </button>
          <button
            onClick={() => setActiveTab('adr')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'adr' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
          >
            <FileCode className="w-4 h-4" />
            <span>ADR</span>
          </button>
          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'workbench' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Пульт</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'api' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
          >
            <Code className="w-4 h-4" />
            <span>API</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Documentation Sidebar (only shown in 'docs' tab on desktop, or inside mobile drawer) */}
        {activeTab === 'docs' && (
          <aside
            className={`${
              mobileMenuOpen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto block' : 'hidden lg:block'
            } w-full lg:w-72 lg:shrink-0 space-y-4`}
          >
            {mobileMenuOpen && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <span className="font-bold text-white text-sm">Навигация по разделам</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                21 Раздел Документации
              </div>
              <p className="text-[11px] text-slate-500 px-1 mb-3">
                Полный каталог спецификаций, моделей и контрактов платформы
              </p>

              <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const isOpen = openCategories[cat.id] ?? false;
                  const containsActiveDoc = cat.items.some(d => d.path === selectedDocPath);

                  return (
                    <div key={cat.id} className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/40">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs font-semibold transition-colors ${
                          containsActiveDoc
                            ? 'bg-blue-950/30 text-blue-300'
                            : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                            {cat.items.length}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-1.5 space-y-1 bg-slate-950/80 border-t border-slate-800/40">
                          {cat.items.map((doc) => {
                            const isSelected = doc.path === selectedDocPath;
                            return (
                              <button
                                key={doc.path}
                                onClick={() => {
                                  setSelectedDocPath(doc.path);
                                  setMobileMenuOpen(false);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                                }`}
                              >
                                <span className="truncate pr-2">{doc.title}</span>
                                {doc.type === 'svg' && (
                                  <span className="text-[9px] px-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0 font-mono">
                                    SVG
                                  </span>
                                )}
                                {doc.type === 'openapi' && (
                                  <span className="text-[9px] px-1 rounded bg-sky-950 text-sky-300 border border-sky-800 shrink-0 font-mono">
                                    API
                                  </span>
                                )}
                                {doc.type === 'proto' && (
                                  <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0 font-mono">
                                    gRPC
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Document Header & Breadcrumbs */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400">
                    <span>docs</span>
                    <span>/</span>
                    <span className="text-slate-300">{currentDoc?.path.replace(/^\/docs\//, '')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    {currentDoc?.type.toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {currentDoc?.title}
                </h1>
              </div>

              {/* Rendered Document */}
              <div className="p-6 md:p-8 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
                {currentDoc?.type === 'svg' ? (
                  <div className="space-y-4 text-center">
                    <div
                      className="max-w-full overflow-auto bg-white/95 rounded-xl p-4 shadow-xl text-slate-900 inline-block"
                      dangerouslySetInnerHTML={{ __html: currentDoc.content }}
                    />
                  </div>
                ) : currentDoc?.type === 'proto' || currentDoc?.type === 'puml' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                      <span className="font-mono text-amber-400 font-semibold">
                        {currentDoc.type === 'proto' ? 'Protocol Buffers v3 Contract Specification' : 'PlantUML Diagram Source Specification'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{currentDoc.path}</span>
                    </div>
                    <pre className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                      <code>{currentDoc.content}</code>
                    </pre>
                  </div>
                ) : (
                  <MarkdownRenderer
                    content={currentDoc?.content || ''}
                    onNavigateDoc={handleNavigateDoc}
                  />
                )}

                {/* Next / Previous Pagination Footer */}
                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  {prevDoc ? (
                    <button
                      onClick={() => {
                        setSelectedDocPath(prevDoc.path);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors w-full sm:w-auto"
                    >
                      <ArrowLeft className="w-4 h-4 text-blue-400" />
                      <div className="text-left">
                        <div className="text-[10px] text-slate-500 uppercase">Предыдущий документ</div>
                        <div className="font-semibold truncate max-w-xs">{prevDoc.title}</div>
                      </div>
                    </button>
                  ) : <div />}

                  {nextDoc ? (
                    <button
                      onClick={() => {
                        setSelectedDocPath(nextDoc.path);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors w-full sm:w-auto text-right ml-auto"
                    >
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">Следующий документ</div>
                        <div className="font-semibold truncate max-w-xs">{nextDoc.title}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    </button>
                  ) : <div />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'c4' && <C4Viewer onNavigateDoc={handleNavigateDoc} />}

          {activeTab === 'adr' && <AdrExplorer onNavigateDoc={handleNavigateDoc} />}

          {activeTab === 'workbench' && <InteractiveWorkbench />}

          {activeTab === 'api' && <ApiExplorer />}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-400">CargoDocs Logistics Platform</span>
            <span>• Техническая архитектура и контракты</span>
          </div>
          <div>
            <span>Модульный монолит • DDD Bounded Contexts • OpenAPI 3.0 • C4 Model</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
