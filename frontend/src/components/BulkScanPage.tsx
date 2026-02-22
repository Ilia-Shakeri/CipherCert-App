import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  X,
  Scan,
  CheckCircle2,
  Loader2,
  Check,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkScanPageProps {
  isDark: boolean;
}

type BulkState = 'idle' | 'preview' | 'scanning' | 'done';

export function BulkScanPage({ isDark }: BulkScanPageProps) {
  const [state, setState] = useState<BulkState>('idle');
  const [dragActive, setDragActive] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string[]>([]);

  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{
    successful: string[];
    failed: string[];
  }>({
    successful: [],
    failed: [],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- Visual constants (DO NOT change between states) ----
  const PADDING = 32; // 32px safe padding all sides (critical)
  const TOP_SAFE = 12; // extra breathing room under header bar
  const TOPBAR_H = 56; // fixed topbar height across states (prevents jumping)
  const FOOTER_H = 76; // fixed footer height across states (prevents jumping)

  const BTN_W = 220; // fixed button width across all states
  const BTN_H = 48; // fixed button height across all states
  const topbarRowH = state === 'preview' ? TOPBAR_H : 0;
  const boxStyle = useMemo(() => {
    return {
      background: isDark
        ? 'rgba(15, 23, 42, 0.55)'
        : 'rgba(255, 255, 255, 0.55)',
      backdropFilter: 'blur(18px)',
      border: isDark
        ? '1px solid rgba(255,255,255,0.08)'
        : '1px solid rgba(8,145,178,0.16)',
      boxShadow: isDark
        ? '0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset'
        : '0 18px 50px rgba(2, 132, 199, 0.10), 0 0 0 1px rgba(2,132,199,0.06) inset',
      borderRadius: 22,
    } as React.CSSProperties;
  }, [isDark]);

  const stageBg = useMemo(() => {
    // Subtle diagonal cyber glass background. Same for all states.
    return {
      background: isDark
        ? `
          linear-gradient(135deg, rgba(34,211,238,0.08), transparent 35%),
          linear-gradient(315deg, rgba(6,182,212,0.06), transparent 35%),
          rgba(15, 23, 42, 0.42)
        `
        : `
          linear-gradient(135deg, rgba(8,145,178,0.08), transparent 35%),
          linear-gradient(315deg, rgba(34,211,238,0.06), transparent 35%),
          rgba(255,255,255,0.55)
        `,
    } as React.CSSProperties;
  }, [isDark]);

  // ---- File processing ----
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (!lines.length) {
        toast.error('File is empty!');
        return;
      }

      setUploadedFile(file);
      setFileContent(lines);
      setProgress({ current: 0, total: lines.length });
      setResults({ successful: [], failed: [] });
      setState('preview');
      toast.success(`Found ${lines.length} targets in file.`);
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    setUploadedFile(null);
    setFileContent([]);
    setProgress({ current: 0, total: 0 });
    setResults({ successful: [], failed: [] });
    setDragActive(false);
    setState('idle');
  };

  // ---- Drag & drop ----
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (state === 'scanning') return;

      if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
      if (e.type === 'dragleave') setDragActive(false);
    },
    [state]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (state === 'scanning') return;

      setDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;

      if (f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt')) {
        processFile(f);
      } else {
        toast.error('Please upload a .txt file');
      }
    },
    [state]
  );

  // ---- Scan logic ----
  const handleStartBulkScan = async () => {
    if (!fileContent.length) return;

    setState('scanning');
    setResults({ successful: [], failed: [] });
    setProgress((p) => ({ ...p, current: 0 }));

    // Basic validation patterns
    const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    const ipv6Regex =
      /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    const domainRegex =
      /^(?!.*@)[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

    for (let i = 0; i < fileContent.length; i++) {
      const target = fileContent[i];
      setProgress((p) => ({ ...p, current: i + 1 }));

      const isValid =
        ipv4Regex.test(target) ||
        ipv6Regex.test(target) ||
        domainRegex.test(target);
      if (!isValid) {
        setResults((r) => ({
          ...r,
          failed: [...r.failed, `${target} (Invalid Format)`],
        }));
        continue;
      }

      try {
        const res = await fetch('http://127.0.0.1:8000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: target }),
        });

        if (res.ok)
          setResults((r) => ({ ...r, successful: [...r.successful, target] }));
        else setResults((r) => ({ ...r, failed: [...r.failed, target] }));
      } catch {
        setResults((r) => ({ ...r, failed: [...r.failed, target] }));
      }
    }

    toast.success('Bulk scan finished!');
    setState('done');
  };

  // ---- Shared UI atoms (fixed sizes) ----
  const PrimaryButton = ({
    label,
    icon,
    onClick,
    disabled,
  }: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        width: BTN_W,
        height: BTN_H,
        borderRadius: 14,
        color: '#0F172A',
        background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
        boxShadow: '0 0 24px rgba(34, 211, 238, 0.35)',
        transform: 'translateZ(0)',
      }}
    >
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          borderRadius: 14,
          boxShadow: '0 0 36px rgba(34, 211, 238, 0.45)',
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );

  const GhostButton = ({
    label,
    icon,
    onClick,
  }: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 font-semibold transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        width: BTN_W,
        height: BTN_H,
        borderRadius: 14,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.16)'
          : '1px solid rgba(8,145,178,0.18)',
        color: isDark ? '#FFFFFF' : '#0F172A',
      }}
    >
      {icon}
      {label}
    </button>
  );

  // ---- Scrollbar theming per panel (only internal boxes scroll) ----
  const themedScrollbar = (kind: 'cyan' | 'green' | 'red') => {
    const colors =
      kind === 'cyan'
        ? {
            thumb: 'rgba(34,211,238,0.35)',
            thumbHover: 'rgba(34,211,238,0.55)',
          }
        : kind === 'green'
          ? {
              thumb: 'rgba(16,185,129,0.35)',
              thumbHover: 'rgba(16,185,129,0.55)',
            }
          : {
              thumb: 'rgba(239,68,68,0.35)',
              thumbHover: 'rgba(239,68,68,0.55)',
            };

    // Inline <style> scoped by attribute selector for predictable behavior
    return `
      [data-scroll="${kind}"] { scrollbar-width: thin; }
      [data-scroll="${kind}"]::-webkit-scrollbar { width: 10px; }
      [data-scroll="${kind}"]::-webkit-scrollbar-track { background: transparent; }
      [data-scroll="${kind}"]::-webkit-scrollbar-thumb {
        background: ${colors.thumb};
        border-radius: 999px;
        border: 3px solid transparent;
        background-clip: content-box;
      }
      [data-scroll="${kind}"]::-webkit-scrollbar-thumb:hover {
        background: ${colors.thumbHover};
        border: 3px solid transparent;
        background-clip: content-box;
      }
    `;
  };

  return (
    <div
      // Fixed page height. No global scroll. Content sits inside 32px safe padding.
      className="w-full h-full overflow-hidden"
      style={{
        padding: PADDING,
        paddingTop: PADDING + TOP_SAFE,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `${themedScrollbar('cyan')}\n${themedScrollbar('green')}\n${themedScrollbar('red')}`,
        }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
      @keyframes bulkPulse {
        0% { transform: scale(0.96); opacity: 0.55; }
        50% { transform: scale(1.06); opacity: 0.95; }
        100% { transform: scale(0.96); opacity: 0.55; }
      }
    `,
        }}
      />

      {/* STAGE: one stable container for ALL states (no resizing, no jumping) */}
      <div
        className="w-full h-full overflow-hidden relative"
        style={{
          ...boxStyle,
          ...stageBg,
          borderRadius: 24,
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Cyan glow border (stronger on drag) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: 24,
            border: dragActive
              ? '1px solid rgba(34,211,238,0.55)'
              : '1px solid rgba(34,211,238,0.18)',
            boxShadow: dragActive
              ? '0 0 0 1px rgba(34,211,238,0.25) inset, 0 0 40px rgba(34,211,238,0.20)'
              : '0 0 0 1px rgba(34,211,238,0.08) inset, 0 0 28px rgba(34,211,238,0.10)',
          }}
        />

        {/* Layout grid with FIXED topbar/footer heights (prevents vertical changes across states) */}
        <div
          className="h-full w-full overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateRows: `${topbarRowH}px 1fr ${FOOTER_H}px`,
          }}
        >
          {/* TOP BAR: fixed height always. Only visible in preview state, but space is reserved always. */}
          <div
            className="px-6 flex items-center"
            style={{
              height: topbarRowH, // hard height so it can become 0
              minHeight: 0, // IMPORTANT: remove the forced minHeight
              overflow: 'hidden', // prevents any leftover content from showing
            }}
          >
            {state === 'preview' && uploadedFile ? (
              <div
                className="w-full flex items-center justify-between"
                style={{
                  height: 44,
                  paddingInline: 14,
                  borderRadius: 14,
                  background: isDark
                    ? 'rgba(15,23,42,0.55)'
                    : 'rgba(255,255,255,0.7)',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.10)'
                    : '1px solid rgba(8,145,178,0.16)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'rgba(34,211,238,0.12)',
                      border: '1px solid rgba(34,211,238,0.22)',
                      boxShadow: '0 0 18px rgba(34,211,238,0.18)',
                      flexShrink: 0,
                    }}
                  >
                    <FileText
                      className="w-4 h-4"
                      style={{ color: '#22D3EE' }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div
                      className="truncate"
                      style={{
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                      title={uploadedFile.name}
                    >
                      {uploadedFile.name}
                    </div>
                    <div
                      style={{
                        color: isDark
                          ? 'rgba(148,163,184,0.9)'
                          : 'rgba(71,85,105,0.9)',
                        fontSize: 12,
                      }}
                    >
                      {fileContent.length} targets detected
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetAll}
                  className="inline-flex items-center justify-center transition-transform active:scale-[0.98]"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.20)',
                    color: '#EF4444',
                  }}
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : topbarRowH > 0 ? (
              <div style={{ width: '100%', height: 44 }} />
            ) : null}
          </div>

          {/* MAIN CONTENT: takes remaining height. MUST be minHeight:0 and overflow hidden. */}
          <div className="px-6 overflow-hidden" style={{ minHeight: 0 }}>
            {/* STATE 1: Upload / Drag & Drop */}
            {state === 'idle' && (
              <div className="h-full w-full flex items-center justify-center text-center">
                <div className="max-w-xl">
                  <div
                    className="mx-auto mb-5 flex items-center justify-center"
                    style={{
                      width: 110,
                      height: 110,
                      borderRadius: 999,
                      background: 'rgba(34,211,238,0.10)',
                      border: dragActive
                        ? '2px solid rgba(34,211,238,0.55)'
                        : '1px solid rgba(34,211,238,0.22)',
                      boxShadow: dragActive
                        ? '0 0 42px rgba(34,211,238,0.25)'
                        : '0 0 26px rgba(34,211,238,0.16)',
                    }}
                  >
                    <Upload className="w-16 h-16" style={{ color: '#22D3EE' }} />
                  </div>

                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 800,
                      fontSize: 38,
                      letterSpacing: '-0.02em',
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      marginBottom: 8,
                      marginTop: 18,
                    }}
                  >
                    Bulk Scan
                  </div>

                  <div
                    style={{
                      color: isDark
                        ? 'rgba(148,163,184,0.95)'
                        : 'rgba(71,85,105,0.9)',
                      marginBottom: 18,
                    }}
                  >
                    Drop your .txt file here (one domain/IP per line)
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) processFile(f);
                      // Reset input value so selecting same file again triggers change
                      e.currentTarget.value = '';
                    }}
                  />

                  <PrimaryButton
                    label="Browse Files"
                    icon={<Upload className="w-5 h-5" />}
                    onClick={() => fileInputRef.current?.click()}
                  />
                </div>
              </div>
            )}

            {/* STATE 2: File Loaded (Preview) */}
            {state === 'preview' && (
              <div
                className="h-full w-full overflow-hidden"
                style={{
                  display: 'grid',
                  gridTemplateRows: '1fr',
                  minHeight: 0,
                }}
              >
                {/* Preview list box (only this scrolls) */}
                <div
                  className="w-full"
                  style={{
                    borderRadius: 18,
                    border: isDark
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid rgba(8,145,178,0.16)',
                    background: isDark
                      ? 'rgba(0,0,0,0.22)'
                      : 'rgba(248,250,252,0.65)',
                    boxShadow: '0 0 0 1px rgba(34,211,238,0.06) inset',

                    // IMPORTANT: grid frame ensures the list becomes the scroller
                    height: '100%',
                    display: 'grid',
                    gridTemplateRows: '44px 1fr',
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="px-4 flex items-center justify-between"
                    style={{
                      borderBottom: isDark
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(8,145,178,0.10)',
                      color: isDark
                        ? 'rgba(148,163,184,0.95)'
                        : 'rgba(71,85,105,0.9)',
                      fontSize: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <span>Detected Targets Preview</span>
                  </div>

                  <div
                    // IMPORTANT: this is the ONLY scroll container
                    data-scroll="cyan"
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                      overflowY: 'auto',
                      minHeight: 0,
                      padding: 14,
                      overscrollBehavior: 'contain',
                    }}
                  >
                    {fileContent.map((t, idx) => (
                      <div
                        key={`${t}-${idx}`}
                        className="text-center"
                        style={{
                          paddingBlock: 10,
                          borderBottom: isDark
                            ? '1px dashed rgba(255,255,255,0.08)'
                            : '1px dashed rgba(2,132,199,0.10)',
                          color: isDark
                            ? 'rgba(226,232,240,0.92)'
                            : 'rgba(15,23,42,0.85)',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 3: Scanning */}
            {state === 'scanning' && (
              <div className="h-full w-full flex items-center justify-center text-center">
                <div className="max-w-xl w-full" style={{ paddingInline: 12 }}>
                  <div
                    className="mx-auto"
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 999,
                      background: 'rgba(34,211,238,0.10)',
                      border: '1px solid rgba(34,211,238,0.26)',
                      boxShadow: '0 0 46px rgba(34,211,238,0.22)',
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: 18,
                      position: 'relative',
                    }}
                  >
                    {/* Outer pulsing ring */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: -10,
                        borderRadius: 999,
                        border: '1px solid rgba(34,211,238,0.18)',
                        boxShadow: '0 0 44px rgba(34,211,238,0.18)',
                        animation: 'bulkPulse 1.6s ease-in-out infinite',
                      }}
                    />
                    <Loader2
                      className="w-12 h-12 animate-spin"
                      style={{ color: '#22D3EE' }}
                    />
                  </div>

                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 800,
                      fontSize: 22,
                      color: isDark ? '#FFFFFF' : '#0F172A',
                      marginBottom: 12,
                    }}
                  >
                    Processing Bulk Scan…
                  </div>

                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: isDark
                        ? 'rgba(148,163,184,0.95)'
                        : 'rgba(71,85,105,0.9)',
                      marginBottom: 18,
                    }}
                  >
                    {progress.current} / {progress.total}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 12,
                      borderRadius: 999,
                      background: isDark
                        ? 'rgba(148,163,184,0.18)'
                        : 'rgba(2,132,199,0.12)',
                      overflow: 'hidden',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid rgba(2,132,199,0.10)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: progress.total
                          ? `${Math.round((progress.current / progress.total) * 100)}%`
                          : '0%',
                        background: 'linear-gradient(90deg, #22D3EE, #06B6D4)',
                        boxShadow: '0 0 18px rgba(34,211,238,0.35)',
                        transition: 'width 220ms ease-out',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STATE 4: Completed (Results) */}
            {state === 'done' && (
              <div className="h-full w-full overflow-visible flex items-center justify-center">
                <div
                  className="w-full overflow-visible"
                  style={{
                    maxWidth: 1060,
                    height: '100%',
                    display: 'grid',
                    gridTemplateRows: '160px 1fr',
                    minHeight: 0,
                  }}
                >
                  {/* Top section */}
                  <div
                    className="flex items-center justify-center text-center"
                    style={{ padding: 24, paddingTop: 32 }}
                  >
                    <div>
                      <div
                        className="flex items-center justify-center"
                        style={{ marginBottom: 1 }}
                      >
                        <div
                          style={{
                            width: 105,
                            height: 105,
                            borderRadius: 999,
                            background: 'rgba(16,185,129,0.12)',
                            border: '1px solid rgba(16,185,129,0.26)',
                            boxShadow: '0 0 44px rgba(16,185,129,0.28)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'visible',
                            marginTop: 15,
                          }}
                        >
                          <CheckCircle2
                            className="w-30 h-30"
                            style={{ color: '#22c55e' }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 800,
                          fontSize: 22,
                          color: isDark ? '#FFFFFF' : '#0F172A',
                          marginBottom: 12,
                        }}
                      >
                        Scan Completed!
                      </div>
                    </div>
                  </div>

                  {/* Results section (MUST be 2 columns always, equal height, no stacking) */}
                  <div
                    className="px-6 pb-6 overflow-hidden"
                    style={{ minHeight: 0 }}
                  >
                    <div
                      className="w-full overflow-hidden"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr', // ALWAYS 2 columns
                        gap: 16,
                        minHeight: 0,
                        height: '100%',
                      }}
                    >
                      {/* Successful */}
                      <div
                        style={{
                          borderRadius: 18,
                          border: '1px solid rgba(16,185,129,0.30)',
                          background: isDark
                            ? 'rgba(16,185,129,0.06)'
                            : 'rgba(240,253,244,0.65)',
                          display: 'grid',
                          gridTemplateRows: '44px 1fr',
                          minHeight: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="px-5 flex items-center justify-between"
                          style={{
                            borderBottom: '1px solid rgba(16,185,129,0.18)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className="w-5 h-5"
                              style={{ color: '#10B981', marginLeft: 10 }}
                            />
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 800,
                                color: '#10B981',
                              }}
                            >
                              Successful
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 800,
                              color: '#10B981',
                              padding: '4px 10px',
                              borderRadius: 10,
                              background: 'rgba(16,185,129,0.10)',
                              border: '1px solid rgba(16,185,129,0.20)',
                              marginRight: 10,
                            }}
                          >
                            {results.successful.length}
                          </span>
                        </div>

                        <div
                          data-scroll="green"
                          onWheel={(e) => e.stopPropagation()} // Prevent parent from eating wheel events (Electron-safe)
                          style={{
                            overflowY: 'auto',
                            minHeight: 0,
                            padding: 12,
                            overscrollBehavior: 'contain',
                          }}
                        >
                          {results.successful.length ? (
                            results.successful.map((t, i) => (
                              <div
                                key={`${t}-${i}`}
                                className="text-center"
                                style={{
                                  paddingBlock: 12,
                                  borderBottom:
                                    '1px dashed rgba(16,185,129,0.16)',
                                  color: isDark
                                    ? 'rgba(226,232,240,0.95)'
                                    : 'rgba(15,23,42,0.85)',
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 13,
                                }}
                              >
                                {t}
                              </div>
                            ))
                          ) : (
                            <div
                              className="text-center"
                              style={{
                                padding: 16,
                                color: 'rgba(16,185,129,0.75)',
                              }}
                            >
                              No successful scans
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Failed */}
                      <div
                        style={{
                          borderRadius: 18,
                          border: '1px solid rgba(239,68,68,0.30)',
                          background: isDark
                            ? 'rgba(239,68,68,0.06)'
                            : 'rgba(254,242,242,0.70)',
                          display: 'grid',
                          gridTemplateRows: '44px 1fr',
                          minHeight: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          className="px-5 flex items-center justify-between"
                          style={{
                            borderBottom: '1px solid rgba(239,68,68,0.18)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <XCircle
                              className="w-5 h-5"
                              style={{ color: '#EF4444', marginLeft: 10 }}
                            />
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 800,
                                color: '#EF4444',
                              }}
                            >
                              Failed
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 800,
                              color: '#EF4444',
                              padding: '4px 10px',
                              borderRadius: 10,
                              background: 'rgba(239,68,68,0.10)',
                              border: '1px solid rgba(239,68,68,0.20)',
                              marginRight: 10,
                            }}
                          >
                            {results.failed.length}
                          </span>
                        </div>

                        <div
                          data-scroll="red"
                          onWheel={(e) => e.stopPropagation()} // Prevent parent from eating wheel events (Electron-safe)
                          style={{
                            overflowY: 'auto',
                            minHeight: 0,
                            padding: 16,
                            overscrollBehavior: 'contain',
                          }}
                        >
                          {results.failed.length ? (
                            results.failed.map((t, i) => (
                              <div
                                key={`${t}-${i}`}
                                className="text-center"
                                style={{
                                  paddingBlock: 12,
                                  borderBottom:
                                    '1px dashed rgba(239,68,68,0.16)',
                                  color: isDark
                                    ? 'rgba(226,232,240,0.95)'
                                    : 'rgba(15,23,42,0.85)',
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 13,
                                }}
                              >
                                {t}
                              </div>
                            ))
                          ) : (
                            <div
                              className="text-center"
                              style={{
                                padding: 16,
                                color: 'rgba(239,68,68,0.75)',
                              }}
                            >
                              No failed scans
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER: fixed height always. Button sizes never change. */}
          <div
            className="px-6 flex items-center justify-center"
            style={{ minHeight: FOOTER_H }}
          >
            {/* Keep footer geometry stable by always rendering a button-sized slot */}
            {state === 'idle' && (
              <div style={{ width: BTN_W, height: BTN_H }} />
            )}
            {state === 'preview' && (
              <PrimaryButton
                label="Confirm & Start Scan"
                icon={<Scan className="w-5 h-5" />}
                onClick={handleStartBulkScan}
              />
            )}
            {state === 'scanning' && (
              <div style={{ width: BTN_W, height: BTN_H }} />
            )}
            {state === 'done' && (
              <GhostButton
                label="Scan New File"
                icon={<Upload className="w-5 h-5" />}
                onClick={resetAll}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
