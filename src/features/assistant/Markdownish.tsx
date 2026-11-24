import * as React from 'react';

const BULLET = /^\s*([-*•]|\d+\.)\s+/;
const TABLE_ROW = /^\s*\|(.+)\|\s*$/;
const TABLE_SEP = /^\s*\|(\s*[-:]+[-|\s:]*)\|\s*$/;

/**
 * Safe, comprehensive markdown renderer for Copilot output.
 * Renders markdown tables, inline code, bold, blockquotes, headings, and lists.
 */
export function Markdownish({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const lines = text.trim().split('\n');
  let list: { depth: number; text: string }[] = [];
  let tableRows: string[][] = [];

  const flushList = () => {
    if (!list.length) return;
    out.push(
      <ul key={`list-${out.length}`} className="my-1.5 space-y-1">
        {list.map((l, i) => (
          <li key={i} className="flex gap-2" style={{ paddingLeft: l.depth * 14 }}>
            <span className="text-primary/70 shrink-0 select-none" aria-hidden>
              •
            </span>
            <span className="text-foreground">{formatInline(l.text)}</span>
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const header = tableRows[0];
    const rows = tableRows.slice(1);

    out.push(
      <div key={`table-${out.length}`} className="my-2.5 overflow-x-auto rounded-lg border border-border bg-card/50">
        <table className="w-full text-left text-xs">
          {header ? (
            <thead className="border-b border-border bg-muted/60 font-semibold text-foreground">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 whitespace-nowrap">
                    {formatInline(col.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody className="divide-y divide-border/60">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                    {formatInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Markdown Table Detection
    if (TABLE_ROW.test(line)) {
      flushList();
      if (TABLE_SEP.test(line)) {
        // separator row, skip
        continue;
      }
      const cols = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cols);
      continue;
    } else {
      flushTable();
    }

    // Bullet List
    if (BULLET.test(line)) {
      const depth = Math.min(3, Math.floor((rawLine.match(/^\s*/)?.[0]?.length ?? 0) / 2));
      list.push({ depth, text: line.replace(BULLET, '') });
      continue;
    }
    flushList();

    // Blockquote
    if (line.startsWith('>')) {
      const quoteText = line.replace(/^>\s*/, '');
      out.push(
        <blockquote
          key={`quote-${out.length}`}
          className="my-2 border-l-2 border-primary/60 bg-primary/5 pl-3 py-1.5 text-xs text-foreground italic rounded-r-md"
        >
          {formatInline(quoteText)}
        </blockquote>,
      );
      continue;
    }

    // Headings
    if (/^###\s+/.test(line)) {
      out.push(
        <h4 key={`h4-${out.length}`} className="mt-3 mb-1 text-xs font-bold text-foreground uppercase tracking-wider">
          {formatInline(line.replace(/^###\s+/, ''))}
        </h4>,
      );
      continue;
    }
    if (/^##\s+/.test(line)) {
      out.push(
        <h3 key={`h3-${out.length}`} className="mt-3.5 mb-1.5 text-sm font-semibold text-foreground tracking-tight">
          {formatInline(line.replace(/^##\s+/, ''))}
        </h3>,
      );
      continue;
    }
    if (/^#\s+/.test(line)) {
      out.push(
        <h2 key={`h2-${out.length}`} className="mt-4 mb-2 text-base font-bold text-foreground">
          {formatInline(line.replace(/^#\s+/, ''))}
        </h2>,
      );
      continue;
    }

    // Standard paragraph
    out.push(
      <p key={`p-${out.length}`} className="text-xs leading-relaxed text-foreground">
        {formatInline(line)}
      </p>,
    );
  }

  flushList();
  flushTable();

  return <div className="space-y-1.5 leading-relaxed">{out}</div>;
}

function formatInline(s: string): React.ReactNode[] {
  // Split on bold (**text**) and inline code (`code`)
  const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary border border-border/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
