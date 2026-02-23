import type { ReactNode } from 'react';
import { HelpButton } from './HelpButton';
import { getHelpEntry } from '../lib/helpContent';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  isDark: boolean;
  pageKey: string;
  actions?: ReactNode;
  showHelp?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  isDark,
  pageKey,
  actions,
  showHelp = true,
}: PageHeaderProps) {
  const helpEntry = getHelpEntry(pageKey);

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1
          className="mb-2"
          style={{
            color: isDark ? '#FFFFFF' : '#0F172A',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {title}
        </h1>
        <p style={{ color: isDark ? '#64748B' : '#94A3B8' }}>{subtitle}</p>
      </div>

      {(actions || showHelp) && (
        <div className="no-drag flex items-center gap-3 mt-6 flex-wrap justify-end">
          {actions}
          {showHelp ? (
            <HelpButton
              title={helpEntry.title}
              content={helpEntry.body}
              learnMoreUrl={helpEntry.learnMoreUrl}
              isDark={isDark}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
