import Link from 'next/link';
import type { ReactNode } from 'react';
import type { GuideBlock } from '@/content/guides';

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

/** Render inline `**bold**` and `[label](href)` markup from content strings. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-text-1">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) {
          const [, label, href] = link as unknown as [string, string, string];
          return href.startsWith('http') ? (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            <Link key={i} href={href}>
              {label}
            </Link>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/** One content block of a guide section. */
export function Block({ block }: { block: GuideBlock }): ReactNode {
  switch (block.type) {
    case 'p':
      return (
        <p className="m-0">
          <Inline text={block.text} />
        </p>
      );
    case 'ul':
    case 'ol': {
      const List = block.type;
      return (
        <List className={`m-0 flex flex-col gap-1.5 pl-[22px] ${block.type === 'ol' ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[520px] border-collapse text-left text-[15px] leading-[1.5]">
            <caption className="sr-only">{block.caption}</caption>
            <thead>
              <tr className="bg-surface-1">
                {block.head.map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="px-4 py-3 font-semibold text-text-1">
                        {cell}
                      </th>
                    ) : (
                      <td key={i} className={`px-4 py-3 ${i === 1 ? 'tnum whitespace-nowrap text-text-1' : 'text-text-2'}`}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
