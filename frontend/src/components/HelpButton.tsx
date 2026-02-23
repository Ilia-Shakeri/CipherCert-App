import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CircleHelp, ExternalLink } from 'lucide-react';
import { createPortal } from 'react-dom';
import { openExternal } from '../lib/external';

interface HelpButtonProps {
  title: string;
  content: ReactNode | string;
  isDark: boolean;
  learnMoreUrl?: string;
}

function renderHelpBody(content: ReactNode | string, isDark: boolean) {
  if (typeof content !== 'string') return content;

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {lines.map((line, index) =>
        line.startsWith('- ') ? (
          <div
            key={`help-line-${index}`}
            className="text-sm flex items-start gap-2"
            style={{ color: isDark ? '#CBD5E1' : '#475569' }}
          >
            <span style={{ color: '#22D3EE' }}>-</span>
            <span>{line.slice(2)}</span>
          </div>
        ) : (
          <p
            key={`help-line-${index}`}
            className="text-sm"
            style={{ color: isDark ? '#CBD5E1' : '#475569' }}
          >
            {line}
          </p>
        )
      )}
    </div>
  );
}

export function HelpButton({
  title,
  content,
  isDark,
  learnMoreUrl,
}: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const popupStyle = useMemo<CSSProperties>(
    () => ({
      position: 'fixed',
      top: popupPos.top,
      left: popupPos.left,
      width: '360px',
      maxWidth: '90vw',
      zIndex: 12000,
      background: isDark ? '#0F172A' : '#FFFFFF',
      border: isDark
        ? '1px solid rgba(34, 211, 238, 0.25)'
        : '1px solid rgba(8, 145, 178, 0.2)',
      boxShadow: isDark
        ? '0 20px 56px rgba(2, 6, 23, 0.75)'
        : '0 20px 56px rgba(15, 23, 42, 0.2)',
      borderRadius: 12,
      padding: 16,
    }),
    [popupPos.left, popupPos.top, isDark]
  );

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const popupWidth = 360;
      const margin = 8;
      const viewportWidth = window.innerWidth;

      let left = rect.right - popupWidth;
      left = Math.max(margin, Math.min(left, viewportWidth - popupWidth - margin));

      const top = rect.bottom + margin;
      setPopupPos({ top, left });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const inPopup = popupRef.current?.contains(target);
      const inButton = buttonRef.current?.contains(target);
      if (!inPopup && !inButton) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Help"
        onClick={() => setOpen((prev) => !prev)}
        className="no-drag w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer"
        style={{
          background: isDark
            ? 'rgba(34, 211, 238, 0.12)'
            : 'rgba(8, 145, 178, 0.12)',
          border: isDark
            ? '1px solid rgba(34, 211, 238, 0.28)'
            : '1px solid rgba(8, 145, 178, 0.28)',
          color: isDark ? '#22D3EE' : '#0891B2',
        }}
        title="Help"
      >
        <CircleHelp className="w-5 h-5" />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={popupRef} className="no-drag" style={popupStyle}>
            <h4
              className="mb-3 text-base font-semibold"
              style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
            >
              {title}
            </h4>

            {renderHelpBody(content, isDark)}

            {learnMoreUrl ? (
              <button
                type="button"
                onClick={() => void openExternal(learnMoreUrl)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
                style={{
                  background: isDark
                    ? 'rgba(34, 211, 238, 0.12)'
                    : 'rgba(8, 145, 178, 0.12)',
                  border: isDark
                    ? '1px solid rgba(34, 211, 238, 0.28)'
                    : '1px solid rgba(8, 145, 178, 0.28)',
                  color: isDark ? '#22D3EE' : '#0891B2',
                }}
              >
                Learn more
                <ExternalLink className="w-4 h-4" />
              </button>
            ) : null}
          </div>,
          document.body
        )}
    </>
  );
}