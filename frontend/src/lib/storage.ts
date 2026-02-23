// frontend/src/lib/storage.ts
// Small safe helpers for localStorage JSON read/write.

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as unknown;

    // Arrays must stay arrays. Also recover data that may have been
    // accidentally stored as {"0":..., "1":...}.
    if (Array.isArray(fallback)) {
      if (Array.isArray(parsed)) return parsed as T;

      if (parsed && typeof parsed === 'object') {
        const record = parsed as Record<string, unknown>;
        const orderedNumericKeys = Object.keys(record)
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => Number(a) - Number(b));

        if (orderedNumericKeys.length > 0) {
          return orderedNumericKeys.map((k) => record[k]) as T;
        }
      }

      return fallback;
    }

    // Objects can be shallow-merged with fallback defaults.
    if (fallback && typeof fallback === 'object') {
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          ...(fallback as Record<string, unknown>),
          ...(parsed as Record<string, unknown>),
        } as T;
      }

      return fallback;
    }

    // Primitive payloads
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures (e.g. storage disabled)
  }
}
