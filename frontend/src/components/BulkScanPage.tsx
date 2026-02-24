import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  CheckCircle2,
  Loader2,
  Play,
  Square,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from './PageHeader';

interface BulkScanPageProps {
  isDark: boolean;
  maxConcurrent: number;
}

type Phase = 'idle' | 'preview' | 'running' | 'done' | 'canceled' | 'error';
type ScanState = 'running' | 'done' | 'canceled' | 'error';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'reset';

type BoxTone = 'success' | 'failed';

interface UploadedFileMeta {
  id: string;
  name: string;
  lines: number;
  sizeKb: number;
  entries: string[];
}

interface BulkScanResult {
  target: string;
  ip: string | null;
  port: number;
  ok: boolean;
  cached: boolean;
  timing_ms: { dns: number; connect: number; tls: number; total: number };
  cert: { issuer: string; days_left: number } | null;
  error: { type: string; message: string } | null;
}

interface BulkStats {
  success: number;
  failed: number;
  cached: number;
  timeout: number;
  dns_error: number;
  tls_error: number;
  conn_error: number;
  unknown_error: number;
  invalid_error: number;
}

interface BulkStatus {
  state: ScanState;
  progress: { done: number; total: number };
  stats: BulkStats;
}

interface BulkCreateResponse {
  scan_id: string;
  accepted: number;
  deduped: number;
}

interface BulkResultsResponse {
  scan_id: string;
  offset: number;
  limit: number;
  total: number;
  results: BulkScanResult[];
  state: ScanState;
}

const BACKEND = 'http://127.0.0.1:8000';
const MAX_TARGETS_PER_REQUEST = 5000;
const CHUNK_SIZE = 500;
const CACHE_TTL_SEC = 120;
const POLL_INTERVAL_MS = 1000;
const FLUSH_INTERVAL_MS = 120;

const createEmptyStats = (): BulkStats => ({
  success: 0,
  failed: 0,
  cached: 0,
  timeout: 0,
  dns_error: 0,
  tls_error: 0,
  conn_error: 0,
  unknown_error: 0,
  invalid_error: 0,
});

const normalizeTarget = (raw: string) => {
  let value = raw.trim().toLowerCase();
  if (!value) return '';
  value = value.replace('https://', '').replace('http://', '').split('/')[0];

  if (value.startsWith('[') && value.includes(']')) {
    value = value.slice(1, value.indexOf(']'));
  }

  if (value.includes(':') && value.split(':').length === 2) {
    const [host, maybePort] = value.split(':');
    if (/^\d+$/.test(maybePort)) {
      value = host;
    }
  }

  return value.replace(/\.$/, '');
};

const isValidTarget = (value: string) => {
  const ipv4 =
    /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test(value);
  const ipv6 = /^[0-9a-f:]+$/i.test(value) && value.includes(':');
  const domain =
    /^(?=.{1,253}$)(?!-)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      value
    );
  return ipv4 || ipv6 || domain;
};

const chunksOf = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const parseJson = <T,>(raw: string): T | null => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const formatSeconds = (sec: number | null) => {
  if (sec === null || !Number.isFinite(sec) || sec < 0) return '--';
  if (sec < 60) return `${Math.round(sec)}s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${Math.round(sec % 60)}s`;
};

const classifyErrorStatKey = (
  type: string | undefined
): keyof BulkStats | null => {
  if (type === 'timeout') return 'timeout';
  if (type === 'dns') return 'dns_error';
  if (type === 'tls') return 'tls_error';
  if (type === 'conn') return 'conn_error';
  if (type === 'invalid') return 'invalid_error';
  if (type) return 'unknown_error';
  return null;
};

const parseLinesToTargets = (lines: string[]) => {
  const uniqueTargets: string[] = [];
  const seen = new Set<string>();
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const line of lines) {
    const normalized = normalizeTarget(line);
    if (!normalized || !isValidTarget(normalized)) {
      invalidCount += 1;
      continue;
    }

    if (seen.has(normalized)) {
      duplicateCount += 1;
      continue;
    }

    seen.add(normalized);
    uniqueTargets.push(normalized);
  }

  return {
    rawCount: lines.length,
    uniqueTargets,
    invalidCount,
    duplicateCount,
  };
};

async function readApiError(response: Response) {
  const text = await response.text();
  const parsed = parseJson<{ detail?: string }>(text);
  if (parsed?.detail) return parsed.detail;
  return text || `Request failed (${response.status})`;
}

function ActionButton({
  label,
  onClick,
  icon,
  variant,
  size = 'md',
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant: ButtonVariant;
  size?: 'md' | 'lg';
  disabled?: boolean;
}) {
  const styleByVariant: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
      color: '#0F172A',
      border: '1px solid rgba(34,211,238,0.45)',
      boxShadow: '0 10px 24px rgba(34,211,238,0.28)',
    },
    secondary: {
      background: 'rgba(34,211,238,0.12)',
      color: '#22D3EE',
      border: '1px solid rgba(34,211,238,0.3)',
    },
    danger: {
      background: 'rgba(239,68,68,0.12)',
      color: '#EF4444',
      border: '1px solid rgba(239,68,68,0.35)',
    },
    ghost: {
      background: 'rgba(148,163,184,0.12)',
      color: '#CBD5E1',
      border: '1px solid rgba(148,163,184,0.25)',
    },
    reset: {
      background: 'rgba(239,68,68,0.1)',
      color: '#FCA5A5',
      border: '1px solid rgba(239,68,68,0.35)',
      boxShadow: '0 0 14px rgba(239,68,68,0.2)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={`bulk-cyber-btn rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 cursor-pointer ${
        size === 'lg' ? 'px-8 py-4 text-base min-w-[200px]' : 'px-4 py-2.5'
      }`}
      style={styleByVariant[variant]}
    >
      {icon}
      {label}
    </button>
  );
}

function StatPill({
  label,
  value,
  isDark,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  isDark: boolean;
  tone?: 'default' | 'success' | 'failed';
}) {
  const palette =
    tone === 'success'
      ? {
          border: 'rgba(16,185,129,0.38)',
          background: isDark ? 'rgba(6,95,70,0.24)' : 'rgba(220,252,231,0.85)',
          label: isDark ? 'rgba(110,231,183,0.95)' : '#047857',
          value: isDark ? '#A7F3D0' : '#065F46',
        }
      : tone === 'failed'
        ? {
            border: 'rgba(239,68,68,0.38)',
            background: isDark
              ? 'rgba(127,29,29,0.24)'
              : 'rgba(254,226,226,0.9)',
            label: isDark ? 'rgba(252,165,165,0.95)' : '#B91C1C',
            value: isDark ? '#FECACA' : '#7F1D1D',
          }
        : {
            border: isDark
              ? 'rgba(148,163,184,0.22)'
              : 'rgba(100,116,139,0.22)',
            background: 'transparent',
            label: isDark ? '#94A3B8' : '#64748B',
            value: isDark ? '#FFFFFF' : '#0F172A',
          };

  return (
    <div
      className="rounded-xl border px-4 py-4"
      style={{
        borderColor: palette.border,
        background: palette.background,
      }}
    >
      <div className="text-xs" style={{ color: palette.label }}>
        {label}
      </div>
      <div className="font-semibold" style={{ color: palette.value }}>
        {value}
      </div>
    </div>
  );
}

function ResultBox({
  isDark,
  tone,
  rows,
  searchTerm,
}: {
  isDark: boolean;
  tone: BoxTone;
  rows: BulkScanResult[];
  searchTerm: string;
}) {
  const isSuccess = tone === 'success';
  const title = isSuccess ? 'Successful' : 'Failed';
  const count = rows.length;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: isSuccess
          ? 'rgba(16,185,129,0.35)'
          : 'rgba(239,68,68,0.35)',
        background: isSuccess
          ? isDark
            ? 'rgba(16,185,129,0.08)'
            : 'rgba(236,253,245,0.85)'
          : isDark
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(254,242,242,0.9)',
      }}
    >
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          borderBottom: isSuccess
            ? '1px solid rgba(16,185,129,0.2)'
            : '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="w-6 h-6" style={{ color: '#10B981' }} />
          ) : (
            <XCircle className="w-6 h-6" style={{ color: '#EF4444' }} />
          )}
          <span
            className="font-bold"
            style={{ color: isSuccess ? '#10B981' : '#EF4444' }}
          >
            {title}
          </span>
        </div>

        <span
          className="text-s font-semibold px-2 py-1 rounded-lg"
          style={{
            color: isSuccess ? '#10B981' : '#EF4444',
            background: isSuccess
              ? 'rgba(16,185,129,0.13)'
              : 'rgba(239,68,68,0.13)',
            border: isSuccess
              ? '1px solid rgba(16,185,129,0.25)'
              : '1px solid rgba(239,68,68,0.25)',
          }}
        >
          {count}
        </span>
      </div>

      <div
        className={`p-4 ${
          isSuccess ? 'bulk-scroll-success' : 'bulk-scroll-failed'
        }`}
        style={{
          height: '21rem',
          overflowY: 'scroll',
        }}
      >
        {rows.length === 0 ? (
          <div
            className="px-4 py-6 text-center text-sm"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            {searchTerm
              ? 'No matching targets found.'
              : isSuccess
                ? 'No successful targets yet.'
                : 'No failed targets yet.'}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const timingText = `dns ${row.timing_ms.dns}ms | tcp ${row.timing_ms.connect}ms | tls ${row.timing_ms.tls}ms | total ${row.timing_ms.total}ms`;
              const cacheSuffix = row.cached
                ? ` | cache hit (ttl ${CACHE_TTL_SEC}s)`
                : '';
              const endpointText = row.ip ? `ip ${row.ip}` : 'ip n/a';
              const subtitle = isSuccess
                ? `days ${row.cert?.days_left ?? '-'} | ${endpointText} | ${timingText}${cacheSuffix}`
                : `${row.error?.type ?? 'error'} | ${endpointText} | ${timingText}${cacheSuffix}`;

              return (
                <div
                  key={`${row.target}-${index}`}
                  className="rounded-xl border pl-9 pr-5 py-4"
                  style={{
                    minHeight: '4.6rem',
                    borderColor: isSuccess
                      ? 'rgba(16,185,129,0.28)'
                      : 'rgba(239,68,68,0.28)',
                    background: isSuccess
                      ? isDark
                        ? 'rgba(6,95,70,0.22)'
                        : 'rgba(220,252,231,0.8)'
                      : isDark
                        ? 'rgba(127,29,29,0.22)'
                        : 'rgba(254,226,226,0.8)',
                    paddingLeft: 15,
                  }}
                >
                  <div
                    className="font-semibold text-[0.95rem] leading-6 break-all pl-1"
                    style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}
                    title={row.target}
                  >
                    {row.target}
                  </div>
                  <div
                    className="text-xs mt-1 leading-5 break-words pl-1"
                    style={{
                      color: isSuccess
                        ? isDark
                          ? 'rgba(110,231,183,0.95)'
                          : '#047857'
                        : isDark
                          ? 'rgba(252,165,165,0.95)'
                          : '#B91C1C',
                    }}
                    title={subtitle}
                  >
                    {subtitle}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function BulkScanPage({ isDark, maxConcurrent }: BulkScanPageProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileMeta[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [targets, setTargets] = useState<string[]>([]);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [stats, setStats] = useState<BulkStats>(createEmptyStats());
  const [message, setMessage] = useState(
    'Upload one or more .txt files to begin.'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [activeChunk, setActiveChunk] = useState({ index: 0, total: 0 });

  const [tick, setTick] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<BulkScanResult[]>([]);
  const incomingRef = useRef<BulkScanResult[]>([]);
  const seenResultKeysRef = useRef<Set<string>>(new Set());
  const progressRef = useRef({ done: 0, total: 0 });
  const statsRef = useRef<BulkStats>(createEmptyStats());

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const activeScanIdRef = useRef<string | null>(null);
  const pollOffsetRef = useRef(0);
  const cancelRequestedRef = useRef(false);

  const cardStyle = {
    background: isDark ? 'rgba(15, 23, 42, 0.54)' : 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(18px)',
    borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(8, 145, 178, 0.2)',
  } as const;

  const closeStreams = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const flushBufferedResults = useCallback(() => {
    if (incomingRef.current.length > 0) {
      resultsRef.current.push(...incomingRef.current.splice(0));
      setTick((value) => value + 1);
    }

    setProgress({ ...progressRef.current });
    setStats({ ...statsRef.current });
  }, []);

  useEffect(() => {
    return () => closeStreams();
  }, [closeStreams]);

  useEffect(() => {
    const id = window.setInterval(flushBufferedResults, FLUSH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [flushBufferedResults]);

  const applyParsedFiles = useCallback((files: UploadedFileMeta[]) => {
    const allLines = files.flatMap((file) => file.entries);
    const parsed = parseLinesToTargets(allLines);
    setRawCount(parsed.rawCount);
    setValidCount(parsed.uniqueTargets.length);
    setInvalidCount(parsed.invalidCount);
    setDuplicateCount(parsed.duplicateCount);
    setTargets(parsed.uniqueTargets);

    if (parsed.uniqueTargets.length > 0) {
      setPhase((current) => (current === 'running' ? current : 'preview'));
      setMessage(
        `Ready to scan ${parsed.uniqueTargets.length} unique targets.`
      );
    } else {
      setPhase((current) => (current === 'running' ? current : 'idle'));
      setMessage('No valid targets loaded yet.');
    }

    return parsed;
  }, []);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      if (phase === 'running') {
        toast.error('Cannot add files while a scan is running.');
        return;
      }

      const supported = files.filter(
        (file) =>
          file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')
      );
      const ignoredCount = files.length - supported.length;

      if (supported.length === 0) {
        toast.error('Please upload one or more .txt files.');
        return;
      }

      const addedMeta: UploadedFileMeta[] = [];

      try {
        for (const file of supported) {
          const text = await file.text();
          const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          addedMeta.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            lines: lines.length,
            sizeKb: Math.max(1, Math.round(file.size / 1024)),
            entries: lines,
          });
        }
      } catch {
        toast.error('Failed to read one or more files.');
        return;
      }

      if (addedMeta.every((file) => file.entries.length === 0)) {
        toast.error('Selected files are empty.');
      }

      let parsed = {
        rawCount: 0,
        uniqueTargets: [] as string[],
        invalidCount: 0,
        duplicateCount: 0,
      };
      setUploadedFiles((previous) => {
        const next = [...previous];
        const ids = new Set(previous.map((item) => item.id));
        for (const item of addedMeta) {
          if (!ids.has(item.id)) {
            next.push(item);
            ids.add(item.id);
          }
        }
        parsed = applyParsedFiles(next);
        return next;
      });

      if (parsed.uniqueTargets.length > 0) {
        toast.success(
          `Added ${supported.length} file(s). ${parsed.uniqueTargets.length} unique targets ready.`
        );
      }

      if (ignoredCount > 0) {
        toast.error(
          `${ignoredCount} file(s) ignored. Only .txt files are supported.`
        );
      }
    },
    [applyParsedFiles, phase]
  );

  const removeUploadedFile = useCallback(
    (fileId: string) => {
      if (phase === 'running') {
        toast.error('Cannot remove files while scan is running.');
        return;
      }

      setUploadedFiles((previous) => {
        const next = previous.filter((item) => item.id !== fileId);
        applyParsedFiles(next);
        return next;
      });

      toast.success('File removed.');
    },
    [applyParsedFiles, phase]
  );

  const handleDrag = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (phase === 'running') return;

      if (event.type === 'dragenter' || event.type === 'dragover') {
        setDragActive(true);
      }
      if (event.type === 'dragleave') {
        setDragActive(false);
      }
    },
    [phase]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      if (phase === 'running') return;

      const files = Array.from(event.dataTransfer.files || []);
      void processFiles(files);
    },
    [phase, processFiles]
  );

  const resetScanRuntime = useCallback(() => {
    closeStreams();
    activeScanIdRef.current = null;
    pollOffsetRef.current = 0;
    cancelRequestedRef.current = false;
    incomingRef.current = [];
    resultsRef.current = [];
    seenResultKeysRef.current.clear();
    progressRef.current = { done: 0, total: 0 };
    statsRef.current = createEmptyStats();
    setProgress({ done: 0, total: 0 });
    setStats(createEmptyStats());
    setTick((value) => value + 1);
    setActiveChunk({ index: 0, total: 0 });
  }, [closeStreams]);

  const resetAll = useCallback(() => {
    resetScanRuntime();
    setPhase('idle');
    setUploadedFiles([]);
    setRawCount(0);
    setValidCount(0);
    setInvalidCount(0);
    setDuplicateCount(0);
    setTargets([]);
    setMessage('Upload one or more .txt files to begin.');
    setStartedAt(null);
  }, [resetScanRuntime]);

  const applyResult = useCallback((result: BulkScanResult) => {
    const key = result.target;
    if (seenResultKeysRef.current.has(key)) return;

    seenResultKeysRef.current.add(key);
    incomingRef.current.push(result);

    progressRef.current = {
      ...progressRef.current,
      done: Math.min(progressRef.current.total, progressRef.current.done + 1),
    };

    if (result.cached) {
      statsRef.current.cached += 1;
    }

    if (result.ok) {
      statsRef.current.success += 1;
    } else {
      statsRef.current.failed += 1;
      const keyName = classifyErrorStatKey(result.error?.type);
      if (keyName) {
        statsRef.current[keyName] += 1;
      }
    }
  }, []);

  const runChunk = useCallback(
    async (
      chunkTargets: string[],
      chunkIndex: number,
      chunkTotal: number
    ): Promise<ScanState> => {
      const createResponse = await fetch(`${BACKEND}/api/scan/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: chunkTargets,
          options: {
            port: 443,
            timeout_ms: 5000,
            max_concurrency: Math.max(10, Math.min(200, maxConcurrent || 50)),
            retries: 1,
            cache_ttl_sec: CACHE_TTL_SEC,
          },
        }),
      });

      if (!createResponse.ok) {
        throw new Error(await readApiError(createResponse));
      }

      const created = (await createResponse.json()) as BulkCreateResponse;
      const scanId = created.scan_id;

      activeScanIdRef.current = scanId;
      pollOffsetRef.current = 0;
      setMessage(
        `Running chunk ${chunkIndex}/${chunkTotal} (${created.deduped} targets)...`
      );

      let finished = false;
      let resolveDone: ((value: ScanState) => void) | null = null;
      const donePromise = new Promise<ScanState>((resolve) => {
        resolveDone = resolve;
      });

      const finish = (state: ScanState) => {
        if (finished) return;
        finished = true;
        closeStreams();
        activeScanIdRef.current = null;
        resolveDone?.(state);
      };

      const pollOnce = async () => {
        if (finished) return;

        try {
          const [statusResponse, resultsResponse] = await Promise.all([
            fetch(`${BACKEND}/api/scan/bulk/${scanId}/status`),
            fetch(
              `${BACKEND}/api/scan/bulk/${scanId}/results?offset=${pollOffsetRef.current}&limit=500`
            ),
          ]);

          if (resultsResponse.ok) {
            const payload =
              (await resultsResponse.json()) as BulkResultsResponse;
            pollOffsetRef.current = payload.offset + payload.results.length;
            for (const item of payload.results) {
              applyResult(item);
            }
          }

          if (statusResponse.ok) {
            const status = (await statusResponse.json()) as BulkStatus;
            if (status.state === 'done') finish('done');
            if (status.state === 'canceled') finish('canceled');
            if (status.state === 'error') finish('error');
          }
        } catch {
          setMessage(
            `Chunk ${chunkIndex}/${chunkTotal}: waiting for backend...`
          );
        }
      };

      if (typeof EventSource !== 'undefined') {
        try {
          const eventSource = new EventSource(
            `${BACKEND}/api/scan/bulk/${scanId}/events?offset=0`
          );
          eventSourceRef.current = eventSource;

          eventSource.addEventListener('result', (event) => {
            if (!(event instanceof MessageEvent)) return;
            const payload = parseJson<BulkScanResult>(event.data);
            if (payload) applyResult(payload);
          });

          eventSource.addEventListener('done', (event) => {
            if (event instanceof MessageEvent) {
              const payload = parseJson<BulkStatus>(event.data);
              if (payload?.state === 'canceled') finish('canceled');
              else if (payload?.state === 'error') finish('error');
              else finish('done');
              return;
            }
            finish('done');
          });

          eventSource.addEventListener('canceled', () => finish('canceled'));

          eventSource.onerror = () => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
              setMessage(
                `Chunk ${chunkIndex}/${chunkTotal}: connection switched to polling fallback.`
              );
            }
          };
        } catch {
          setMessage(
            `Chunk ${chunkIndex}/${chunkTotal}: SSE unavailable, using polling fallback.`
          );
        }
      }

      await pollOnce();
      if (!finished) {
        pollTimerRef.current = window.setInterval(() => {
          void pollOnce();
        }, POLL_INTERVAL_MS);
      }

      return donePromise;
    },
    [applyResult, closeStreams, maxConcurrent]
  );

  const startScan = useCallback(async () => {
    if (!targets.length) {
      toast.error('No valid targets to scan.');
      return;
    }

    const chunks = chunksOf(
      targets,
      Math.min(CHUNK_SIZE, MAX_TARGETS_PER_REQUEST)
    );
    cancelRequestedRef.current = false;
    resetScanRuntime();

    progressRef.current = { done: 0, total: targets.length };
    setProgress({ ...progressRef.current });

    setPhase('running');
    setStartedAt(Date.now());
    setActiveChunk({ index: 0, total: chunks.length });
    setMessage(`Preparing ${chunks.length} chunk(s)...`);

    toast.loading('Bulk scan started', { id: 'bulk-scan' });

    try {
      for (let index = 0; index < chunks.length; index += 1) {
        if (cancelRequestedRef.current) break;

        setActiveChunk({ index: index + 1, total: chunks.length });
        const state = await runChunk(chunks[index], index + 1, chunks.length);

        if (state === 'canceled') {
          cancelRequestedRef.current = true;
          break;
        }

        if (state === 'error') {
          throw new Error(`Chunk ${index + 1} failed`);
        }
      }

      flushBufferedResults();
      closeStreams();

      if (cancelRequestedRef.current) {
        setPhase('canceled');
        setMessage('Bulk scan canceled.');
        toast.error('Bulk scan canceled', { id: 'bulk-scan' });
      } else {
        setPhase('done');
        setMessage('Bulk scan completed.');
        toast.success('Bulk scan completed', { id: 'bulk-scan' });
      }
    } catch (error) {
      flushBufferedResults();
      closeStreams();
      setPhase('error');
      setMessage(error instanceof Error ? error.message : 'Bulk scan failed.');
      toast.error('Bulk scan failed', { id: 'bulk-scan' });
    }
  }, [closeStreams, flushBufferedResults, resetScanRuntime, runChunk, targets]);

  const cancelScan = useCallback(async () => {
    cancelRequestedRef.current = true;
    setMessage('Cancel requested...');

    const scanId = activeScanIdRef.current;
    if (!scanId) {
      setPhase('canceled');
      closeStreams();
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND}/api/scan/bulk/${scanId}/cancel`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
      toast.success('Cancel request sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Cancel failed');
    }
  }, [closeStreams]);

  const allRows = useMemo(() => [...resultsRef.current], [tick]);

  const successRows = useMemo(() => allRows.filter((row) => row.ok), [allRows]);
  const failedRows = useMemo(() => allRows.filter((row) => !row.ok), [allRows]);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSuccessRows = useMemo(
    () =>
      normalizedSearch
        ? successRows.filter((row) =>
            row.target.toLowerCase().includes(normalizedSearch)
          )
        : successRows,
    [normalizedSearch, successRows]
  );
  const filteredFailedRows = useMemo(
    () =>
      normalizedSearch
        ? failedRows.filter((row) =>
            row.target.toLowerCase().includes(normalizedSearch)
          )
        : failedRows,
    [failedRows, normalizedSearch]
  );

  const elapsedSec =
    startedAt !== null ? Math.max(0, (Date.now() - startedAt) / 1000) : null;
  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="p-8 md:p-10 space-y-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bulkPulse {
              0% { transform: scale(0.96); opacity: 0.55; }
              50% { transform: scale(1.05); opacity: 0.95; }
              100% { transform: scale(0.96); opacity: 0.55; }
            }
            @keyframes bulkSweep {
              0% { transform: translateX(-140%) skewX(-22deg); opacity: 0; }
              40% { opacity: .35; }
              100% { transform: translateX(170%) skewX(-22deg); opacity: 0; }
            }
            .bulk-cyber-btn {
              position: relative;
              overflow: hidden;
              isolation: isolate;
            }
            .bulk-cyber-btn::after {
              content: '';
              position: absolute;
              inset: -20% -40%;
              background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.25) 50%, transparent 70%);
              pointer-events: none;
              opacity: 0;
            }
            .bulk-cyber-btn:hover::after {
              animation: bulkSweep .7s ease-out;
            }
            .bulk-cyber-btn[data-variant='primary']:hover { box-shadow: 0 0 0 1px rgba(34,211,238,.5), 0 14px 30px rgba(34,211,238,.32); }
            .bulk-cyber-btn[data-variant='secondary']:hover { box-shadow: 0 0 0 1px rgba(34,211,238,.45), 0 12px 24px rgba(34,211,238,.22); }
            .bulk-cyber-btn[data-variant='danger']:hover { box-shadow: 0 0 0 1px rgba(239,68,68,.5), 0 12px 24px rgba(239,68,68,.28); }
            .bulk-cyber-btn[data-variant='reset']:hover { box-shadow: 0 0 0 1px rgba(248,113,113,.5), 0 14px 28px rgba(239,68,68,.28); }
            .bulk-cyber-btn[data-variant='ghost']:hover { box-shadow: 0 0 0 1px rgba(148,163,184,.35), 0 10px 20px rgba(148,163,184,.2); }
            .bulk-cyber-icon-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 0 0 1px rgba(34,211,238,.42), 0 10px 22px rgba(34,211,238,.24);
            }
            .bulk-cyber-icon-btn-danger:hover {
              transform: translateY(-1px);
              box-shadow: 0 0 0 1px rgba(239,68,68,.45), 0 10px 22px rgba(239,68,68,.24);
            }
            .bulk-scroll-success { scrollbar-width: thin; scrollbar-color: rgba(16,185,129,0.65) rgba(16,185,129,0.12); }
            .bulk-scroll-success::-webkit-scrollbar { width: 10px; }
            .bulk-scroll-success::-webkit-scrollbar-track { background: rgba(16,185,129,0.1); border-radius: 10px; }
            .bulk-scroll-success::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.55); border-radius: 10px; border: 2px solid rgba(16,185,129,0.12); }
            .bulk-scroll-failed { scrollbar-width: thin; scrollbar-color: rgba(239,68,68,0.65) rgba(239,68,68,0.12); }
            .bulk-scroll-failed::-webkit-scrollbar { width: 10px; }
            .bulk-scroll-failed::-webkit-scrollbar-track { background: rgba(239,68,68,0.1); border-radius: 10px; }
            .bulk-scroll-failed::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.55); border-radius: 10px; border: 2px solid rgba(239,68,68,0.12); }
          `,
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          void processFiles(files);
          event.currentTarget.value = '';
        }}
      />

      <PageHeader
        title="Bulk Scan"
        subtitle="Import files, scan in bulk, and monitor live success/failure lists"
        isDark={isDark}
        pageKey="bulk-scan"
      />

      <div
        className="rounded-2xl border p-8 transition-all duration-200"
        style={{
          ...cardStyle,
          borderStyle: 'dashed',
          borderWidth: dragActive ? '1.5px' : '1px',
          borderColor: dragActive
            ? 'rgba(34,211,238,0.5)'
            : cardStyle.borderColor,
          boxShadow: dragActive
            ? '0 0 0 1px rgba(34,211,238,0.25), 0 12px 30px rgba(34,211,238,0.18)'
            : 'none',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={phase === 'running'}
              className="bulk-cyber-icon-btn w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(34,211,238,0.14)',
                border: '1px solid rgba(34,211,238,0.3)',
              }}
              title="Upload files"
              aria-label="Upload files"
            >
              <Upload className="w-5 h-5" style={{ color: '#22D3EE' }} />
            </button>
            <div>
              <h3
                className="font-semibold"
                style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
              >
                Drag and drop one or more `.txt` files
              </h3>
              <p
                className="text-sm"
                style={{ color: isDark ? '#94A3B8' : '#64748B' }}
              >
                You can keep adding files before scanning.
              </p>
            </div>
          </div>

          <ActionButton
            label="Add Files"
            icon={<Upload className="w-5 h-5" />}
            variant="secondary"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={phase === 'running'}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2 mb-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="rounded-xl border px-3 py-2 flex items-center justify-between gap-3"
                  style={{
                    borderColor: isDark
                      ? 'rgba(34,211,238,0.34)'
                      : 'rgba(8,145,178,0.3)',
                    background: isDark
                      ? 'rgba(8,47,73,0.32)'
                      : 'rgba(236,254,255,0.92)',
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="font-medium truncate"
                      style={{ color: isDark ? '#E2E8F0' : '#0F172A' }}
                      title={file.name}
                    >
                      {file.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                    >
                      {file.lines} lines - {file.sizeKb} KB
                    </div>
                  </div>

                  <button
                    onClick={() => removeUploadedFile(file.id)}
                    className="bulk-cyber-icon-btn-danger p-2 rounded-lg transition-all duration-200 cursor-pointer"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.28)',
                      color: '#EF4444',
                    }}
                    title="Remove file"
                    disabled={phase === 'running'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div
              className="grid gap-2 mb-1"
              style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
            >
              <StatPill
                label="Files"
                value={uploadedFiles.length}
                isDark={isDark}
              />
              <StatPill label="Raw Lines" value={rawCount} isDark={isDark} />
              <StatPill
                label="Unique Targets"
                value={validCount}
                isDark={isDark}
              />
              <StatPill
                label="Invalid + Duplicate"
                value={invalidCount + duplicateCount}
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border p-6 space-y-5" style={cardStyle}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 w-full max-w-2xl">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search domain in results..."
                className="w-full rounded-2xl border px-4 py-3 text-[1.02rem] font-medium outline-none transition-all duration-200"
                style={{
                  borderColor: isDark
                    ? 'rgba(34,211,238,0.36)'
                    : 'rgba(8,145,178,0.3)',
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.64))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))',
                  color: isDark ? '#E2E8F0' : '#0F172A',
                  boxShadow: isDark
                    ? '0 10px 24px rgba(2,132,199,0.16), inset 0 0 0 1px rgba(34,211,238,0.08)'
                    : '0 10px 24px rgba(14,116,144,0.08), inset 0 0 0 1px rgba(8,145,178,0.08)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {phase === 'running' ? (
              <>
                <div
                  className="relative w-11 h-11 rounded-full grid place-items-center"
                  style={{
                    border: '1px solid rgba(34,211,238,0.35)',
                    background: 'rgba(34,211,238,0.1)',
                    boxShadow: '0 0 24px rgba(34,211,238,0.24)',
                    animation: 'bulkPulse 1.4s ease-in-out infinite',
                  }}
                >
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: '#22D3EE' }}
                  />
                </div>
                <ActionButton
                  label="Cancel Scan"
                  icon={<Square className="w-4 h-4" />}
                  variant="danger"
                  size="lg"
                  onClick={cancelScan}
                />
              </>
            ) : (
              <ActionButton
                label="Start Scanning"
                icon={<Play className="w-5 h-5" />}
                variant="primary"
                size="lg"
                onClick={startScan}
                disabled={targets.length === 0}
              />
            )}

            <ActionButton
              label="Reset"
              icon={<X className="w-5 h-5" />}
              variant="reset"
              size="lg"
              onClick={resetAll}
              disabled={phase === 'running'}
            />
          </div>
        </div>

        <div
          className="h-3 rounded-full overflow-hidden mt-4"
          style={{
            background: isDark
              ? 'rgba(148,163,184,0.2)'
              : 'rgba(148,163,184,0.24)',
          }}
        >
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #22D3EE, #06B6D4)',
              boxShadow: '0 0 18px rgba(34,211,238,0.4)',
            }}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <ResultBox
            isDark={isDark}
            tone="success"
            rows={filteredSuccessRows}
            searchTerm={normalizedSearch}
          />
          <ResultBox
            isDark={isDark}
            tone="failed"
            rows={filteredFailedRows}
            searchTerm={normalizedSearch}
          />
        </div>
      </div>
    </div>
  );
}
