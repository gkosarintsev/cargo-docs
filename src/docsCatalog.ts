// Import all markdown documents, SVGs, and YAML/Proto specs as raw text strings
const rawDocs = import.meta.glob('/docs/**/*.{md,yaml,yml,svg,puml,proto}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface DocCategory {
  id: string;
  number: string;
  title: string;
  iconName: string;
  description: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  path: string;
  title: string;
  category: string;
  type: 'markdown' | 'svg' | 'openapi' | 'puml' | 'proto';
  content: string;
}

// Category metadata definitions mapping directory numbers to descriptive titles
export const CATEGORIES_META: Record<string, { title: string; icon: string; desc: string }> = {
  '00': { title: 'Главная & Глоссарий', icon: 'BookOpen', desc: 'Общая концепция и терминология платформы' },
  '01': { title: '01. Продукт и домен', icon: 'Compass', desc: 'Обзор продукта, роли участников, Bounded Contexts' },
  '02': { title: '02. Требования', icon: 'ShieldCheck', desc: 'Функциональные и NFR требования, масштабируемость' },
  '03': { title: '03. Архитектура & C4 & ADR', icon: 'Layers', desc: 'Модульный монолит, C4 диаграммы и 15 архитектурных решений' },
  '04': { title: '04. Доменная модель', icon: 'Boxes', desc: 'Агрегаты, сущности, конечные автоматы и ERD' },
  '05': { title: '05. Бизнес-процессы', icon: 'GitMerge', desc: 'Workflows, load-to-order, исключительные сценарии' },
  '06': { title: '06. Маркетплейс', icon: 'ShoppingBag', desc: 'Биржа грузов и транспорта, матчинг и торги' },
  '07': { title: '07. Исполнение перевозки', icon: 'Truck', desc: 'Транспортный заказ, погрузка, транзит и PoD' },
  '08': { title: '08. Компании и доверие', icon: 'Award', desc: 'Верификация, рейтинги, скоринг рисков и репутация' },
  '09': { title: '09. Автопарк (Fleet)', icon: 'Car', desc: 'Транспортные средства, прицепы, водители, доступность' },
  '10': { title: '10. Гео и маршрутизация', icon: 'MapPin', desc: 'GPS телеметрия, геоиндексирование, ETA, трекинг' },
  '11': { title: '11. Документооборот', icon: 'FileText', desc: 'Электронные документы (ЭТрН), подписи и архив' },
  '12': { title: '12. Финансы', icon: 'DollarSign', desc: 'Фрахтовые ставки, биллинг, факторинг и гарантии' },
  '13': { title: '13. Коммуникация', icon: 'MessageSquare', desc: 'Мессенджер, WebSocket, push и SMS уведомления' },
  '14': { title: '14. API & Контракты', icon: 'Code', desc: 'OpenAPI спеки (9 сервисов), AsyncAPI, gRPC Protobuf' },
  '15': { title: '15. Архитектура данных', icon: 'Database', desc: 'PostgreSQL, репликация, Outbox, партиционирование' },
  '16': { title: '16. Интеграции', icon: 'Cpu', desc: 'Интеграции с TMS, ERP, WMS, GPS, биржи и верификация' },
  '17': { title: '17. Безопасность', icon: 'Lock', desc: 'Tenant isolation, аудит, threat model, шифрование' },
  '18': { title: '18. Наблюдаемость', icon: 'Activity', desc: 'Prometheus, Grafana, OpenTelemetry, SLO/SLA' },
  '19': { title: '19. Эксплуатация & SRE', icon: 'Server', desc: 'CI/CD, runbooks для сбоев, бэкапы, DR план' },
  '20': { title: '20. UI Контракты & Экраны', icon: 'Layout', desc: 'Salt макеты, Диспетчерский пульт, Поиск грузов' },
  '21': { title: '21. Тестирование', icon: 'CheckCircle2', desc: 'Стратегия тестирования, E2E, Chaos & Load тесты' },
};

function formatDocTitle(filename: string): string {
  const clean = filename.replace(/\.(md|yaml|yml|svg|puml|proto)$/, '');
  if (clean === 'README') return 'Обзор документации (README)';
  if (clean === 'glossary') return 'Глоссарий терминов';
  
  // Handle ADRs like 0001-architecture-style
  if (/^\d{4}-/.test(clean)) {
    const parts = clean.split('-');
    const num = parts[0];
    const name = parts.slice(1).join(' ').replace(/-/g, ' ');
    return `ADR-${num}: ${name.charAt(0).toUpperCase() + name.slice(1)}`;
  }
  
  // Replace dashes with spaces and capitalize
  return clean
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getAllDocs(): DocItem[] {
  const items: DocItem[] = [];

  for (const [path, content] of Object.entries(rawDocs)) {
    // e.g. /docs/03-architecture/adr/0001-architecture-style.md
    const relative = path.replace(/^\/docs\//, '');
    const parts = relative.split('/');
    
    let categoryKey = '00';
    if (parts.length > 1) {
      const firstPart = parts[0];
      const match = firstPart.match(/^(\d{2})/);
      if (match) {
        categoryKey = match[1];
      }
    } else if (parts[0] === 'README.md' || parts[0].includes('glossary')) {
      categoryKey = '00';
    }

    const filename = parts[parts.length - 1];
    let type: DocItem['type'] = 'markdown';
    if (filename.endsWith('.svg')) type = 'svg';
    else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) type = 'openapi';
    else if (filename.endsWith('.puml')) type = 'puml';
    else if (filename.endsWith('.proto')) type = 'proto';

    // Skip raw puml if svg counterpart exists to keep UI uncluttered
    if (type === 'puml') {
      const svgPath = path.replace(/\.puml$/, '.svg');
      if (rawDocs[svgPath]) continue;
    }

    items.push({
      id: path,
      path,
      title: formatDocTitle(filename),
      category: categoryKey,
      type,
      content,
    });
  }

  // Sort items logically
  items.sort((a, b) => a.path.localeCompare(b.path));
  return items;
}

export function getCategoriesWithDocs(): DocCategory[] {
  const allDocs = getAllDocs();
  const categoriesMap = new Map<string, DocItem[]>();

  for (const doc of allDocs) {
    if (!categoriesMap.has(doc.category)) {
      categoriesMap.set(doc.category, []);
    }
    categoriesMap.get(doc.category)!.push(doc);
  }

  const result: DocCategory[] = [];
  const sortedKeys = Array.from(categoriesMap.keys()).sort();

  for (const key of sortedKeys) {
    const meta = CATEGORIES_META[key] || {
      title: `Раздел ${key}`,
      icon: 'Folder',
      desc: 'Документы и спецификации раздела',
    };

    result.push({
      id: key,
      number: key,
      title: meta.title,
      iconName: meta.icon,
      description: meta.desc,
      items: categoriesMap.get(key) || [],
    });
  }

  return result;
}
