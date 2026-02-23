import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

type HistoryItem = { domain?: string };

interface TargetPickerProps {
  isDark: boolean;
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  helperText?: string;
}

const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const ipv6Regex =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const domainRegex =
  /^(?!.*@)[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

function isValidTarget(v: string): boolean {
  return ipv4Regex.test(v) || ipv6Regex.test(v) || domainRegex.test(v);
}

function uniq(list: string[]) {
  return Array.from(new Set(list));
}

export function TargetPicker({
  isDark,
  label,
  value,
  onChange,
  helperText,
}: TargetPickerProps) {
  const [input, setInput] = useState('');
  const [knownTargets, setKnownTargets] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const normalizedValue = useMemo(
    () => uniq(value.map((x) => x.trim()).filter(Boolean)),
    [value]
  );

  useEffect(() => {
    // Keep parent state normalized
    if (normalizedValue.join('|') !== value.join('|')) {
      onChange(normalizedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedValue.join('|')]);

  const toggle = (t: string) => {
    if (normalizedValue.includes(t))
      onChange(normalizedValue.filter((x) => x !== t));
    else onChange([...normalizedValue, t]);
  };

  const remove = (t: string) =>
    onChange(normalizedValue.filter((x) => x !== t));

  const addFromInput = () => {
    const t = input.trim();
    if (!t) return;

    if (!isValidTarget(t)) {
      toast.error('Invalid domain/IP format');
      return;
    }

    if (normalizedValue.includes(t)) {
      toast.message('Already added');
      setInput('');
      return;
    }

    onChange([...normalizedValue, t]);
    setInput('');
  };

  const loadFromHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/history');
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as HistoryItem[];
      const domains = uniq(
        data
          .map((x) => (x.domain || '').trim())
          .filter(Boolean)
          .filter((x) => isValidTarget(x))
      );
      setKnownTargets(domains);
      toast.success(`Loaded ${domains.length} targets from history`);
    } catch {
      toast.error('Could not load targets from history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label
          className="block mb-2 text-sm font-semibold"
          style={{ color: isDark ? '#94A3B8' : '#64748B' }}
        >
          {label}
        </label>
        {helperText ? (
          <div
            className="text-xs mb-2"
            style={{ color: isDark ? '#64748B' : '#94A3B8' }}
          >
            {helperText}
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addFromInput();
            }}
            placeholder="Type domain or IP and press Enter"
            className="flex-1 px-4 py-3 rounded-xl border bg-transparent outline-none"
            style={{
              borderColor: isDark
                ? 'rgba(34, 211, 238, 0.2)'
                : 'rgba(8, 145, 178, 0.2)',
              color: isDark ? '#FFFFFF' : '#0F172A',
            }}
          />
          <button
            onClick={addFromInput}
            className="px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(34, 211, 238, 0.12)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              color: '#22D3EE',
            }}
            title="Add target"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={loadFromHistory}
            disabled={loadingHistory}
            className="px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
            style={{
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(15,23,42,0.06)',
              border: isDark
                ? '1px solid rgba(255,255,255,0.12)'
                : '1px solid rgba(8,145,178,0.18)',
              color: isDark ? '#94A3B8' : '#64748B',
            }}
            title="Load known targets from scan history"
          >
            <RefreshCw
              className={`w-5 h-5 ${loadingHistory ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2">
        {normalizedValue.length === 0 ? (
          <div
            className="text-sm"
            style={{ color: isDark ? '#64748B' : '#94A3B8' }}
          >
            No targets selected yet.
          </div>
        ) : (
          normalizedValue.map((t) => (
            <div
              key={t}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                background: isDark
                  ? 'rgba(15, 23, 42, 0.35)'
                  : 'rgba(255,255,255,0.6)',
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.22)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#E2E8F0' : '#0F172A',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
              }}
            >
              {t}
              <button
                onClick={() => remove(t)}
                className="rounded-md"
                style={{ color: '#EF4444' }}
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Known targets checklist */}
      {knownTargets.length > 0 && (
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: isDark
              ? 'rgba(15, 23, 42, 0.3)'
              : 'rgba(255, 255, 255, 0.5)',
            borderColor: isDark
              ? 'rgba(34, 211, 238, 0.2)'
              : 'rgba(8, 145, 178, 0.2)',
          }}
        >
          <div
            className="text-sm font-semibold mb-3"
            style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
          >
            Known targets (from history)
          </div>

          <div className="max-h-40 overflow-auto space-y-2 pr-1">
            {knownTargets.map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalizedValue.includes(t)}
                  onChange={() => toggle(t)}
                />
                <span
                  style={{
                    color: isDark ? '#CBD5E1' : '#334155',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {t}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
