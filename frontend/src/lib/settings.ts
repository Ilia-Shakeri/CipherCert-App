// frontend/src/lib/settings.ts
// Settings types + persistence + global apply (no React / no JSX in this file)

import { loadJson, saveJson } from "./storage";

export type ScanInterval = "hourly" | "daily" | "weekly" | "monthly";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
  apiKey: string;

  notifications: {
    emailRecipients: string[];
  };

  scanning: {
    autoScan: boolean;
    scanInterval: ScanInterval;
    maxConcurrent: number;
    autoScanTargets: string[];
  };

  appearance: {
    fontSize: FontSize;
    animations: boolean;
  };
}

export const SETTINGS_STORAGE_KEY = "ciphercert_settings_v2";

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "sk_live_xxxxxxxxxxxxxxxxxxxx",
  notifications: { emailRecipients: [] },
  scanning: {
    autoScan: true,
    scanInterval: "daily",
    maxConcurrent: 10,
    autoScanTargets: [],
  },
  appearance: { fontSize: "medium", animations: true },
};

export function loadSettings(): AppSettings {
  const raw = loadJson<AppSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...raw.notifications },
    scanning: { ...DEFAULT_SETTINGS.scanning, ...raw.scanning },
    appearance: { ...DEFAULT_SETTINGS.appearance, ...raw.appearance },
  };
}

export function saveSettings(settings: AppSettings): void {
  saveJson(SETTINGS_STORAGE_KEY, settings);
}

export function applySettingsToDom(settings: AppSettings): void {
  // Global font size hook: html { font-size: var(--font-size); }
  const fontPx =
    settings.appearance.fontSize === "small"
      ? 14
      : settings.appearance.fontSize === "large"
        ? 18
        : 16;

  document.documentElement.style.setProperty("--font-size", `${fontPx}px`);
}