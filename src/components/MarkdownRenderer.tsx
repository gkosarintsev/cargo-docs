import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  allDocs?: Record<string, string>;
  onNavigateDoc?: (docPath: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onNavigateDoc,
}) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Pre-process markdown into blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  let codeBlockCounter = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      const codeText = codeLines.join('\n');
      const currentCodeIdx = codeBlockCounter++;

      // If mermaid, display as nicely styled flowchart card
      const isMermaid = language === 'mermaid';

      elements.push(
        <div key={`code-${i}`} className="my-5 rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg shadow-black/40">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400">
            <span className="font-mono uppercase tracking-wider font-semibold text-blue-400">
              {language || 'text'} {isMermaid && '• Flowchart Specification'}
            </span>
            <button
              onClick={() => handleCopyCode(codeText, currentCodeIdx)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              {copiedCodeIdx === currentCodeIdx ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto text-slate-200 leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      const text = line.slice(2).trim();
      elements.push(
        <h1 key={`h1-${i}`} className="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
          <span className="text-blue-500">#</span> {text}
        </h1>
      );
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl md:text-2xl font-bold text-slate-100 mt-6 mb-3 flex items-center gap-2">
          <span className="text-sky-500">##</span> {text}
        </h2>
      );
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      const text = line.slice(4).trim();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg md:text-xl font-semibold text-slate-200 mt-5 mb-2 flex items-center gap-2">
          <span className="text-indigo-400">###</span> {text}
        </h3>
      );
      i++;
      continue;
    }

    // Heading 4
    if (line.startsWith('#### ')) {
      const text = line.slice(5).trim();
      elements.push(
        <h4 key={`h4-${i}`} className="text-base font-semibold text-slate-300 mt-4 mb-2">
          {text}
        </h4>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++;
        quoteLines.push(lines[i].slice(2));
      }
      elements.push(
        <blockquote key={`quote-${i}`} className="my-4 pl-4 border-l-4 border-blue-500 bg-blue-950/20 py-2 pr-4 rounded-r-lg text-slate-300 italic text-sm">
          {quoteLines.join(' ')}
        </blockquote>
      );
      i++;
      continue;
    }

    // Markdown Table
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const bodyRows = tableLines.slice(2).map(row =>
          row.split('|').slice(1, -1).map(c => c.trim())
        );

        elements.push(
          <div key={`table-${i}`} className="my-5 overflow-x-auto rounded-xl border border-slate-800 shadow-md">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 font-semibold">
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx} className="px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-slate-300">
                        {renderInlineFormatting(cell, onNavigateDoc)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Images: ![alt](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      elements.push(
        <div key={`img-${i}`} className="my-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg text-center">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              {alt || 'Архитектурная схема / UI Макет'}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">{src}</span>
          </div>
          <div className="flex justify-center p-2 bg-white/5 rounded-xl overflow-auto max-h-[500px]">
            <img
              src={src.startsWith('/') ? src : `/docs/${src}`}
              alt={alt}
              className="max-w-full h-auto object-contain rounded-lg shadow-sm"
              onError={(e) => {
                // If relative link failed, fallback to direct path
                const target = e.currentTarget;
                if (!target.src.includes('error-fallback')) {
                  target.src = `/docs/20-ui/screen-contracts/${src}`;
                }
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{alt}</p>
        </div>
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-slate-800" />);
      i++;
      continue;
    }

    // Unordered List item
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-6 list-disc text-slate-300 text-sm leading-relaxed marker:text-blue-500">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInlineFormatting(item, onNavigateDoc)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List item
    if (/^\d+\.\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-6 list-decimal text-slate-300 text-sm leading-relaxed marker:text-blue-400 font-normal">
          {listItems.map((item, lIdx) => (
            <li key={lIdx}>{renderInlineFormatting(item, onNavigateDoc)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-2 text-slate-300 text-sm leading-relaxed">
        {renderInlineFormatting(line, onNavigateDoc)}
      </p>
    );
    i++;
  }

  return <div className="markdown-body max-w-none text-slate-200">{elements}</div>;
};

// Helper to format inline elements: **bold**, `code`, [links](url), badges
function renderInlineFormatting(
  text: string,
  onNavigateDoc?: (path: string) => void
): React.ReactNode {
  // Check for status badges like **Status**: Accepted
  if (text.includes('Status: Accepted') || text.includes('**Status**: Accepted')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <Check className="w-3 h-3" /> Статус: Принято (Accepted)
      </span>
    );
  }

  // Split tokens by link, code, bold
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      const isInternal = url.endsWith('.md') || url.includes('/');

      return (
        <button
          key={index}
          onClick={() => {
            if (onNavigateDoc && isInternal) {
              onNavigateDoc(url);
            }
          }}
          className="inline-flex items-center gap-0.5 text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
        >
          {label}
          {isInternal ? (
            <span className="text-[10px] text-blue-400/70 ml-0.5">↗</span>
          ) : (
            <ExternalLink className="w-3 h-3 ml-0.5 inline" />
          )}
        </button>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs border border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
