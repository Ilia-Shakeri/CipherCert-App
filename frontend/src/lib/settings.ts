// frontend/src/lib/settings.ts
// Settings types + persistence + global apply (no React / no JSX in this file)

import { loadJson, saveJson } from "./storage";

export type ScanInterval = "hourly" | "daily" | "weekly" | "monthly";
export type FontSize = "small" | "medium" | "large";

export interface AppSettings {
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
  const raw = loadJson<Record<string, unknown>>(SETTINGS_STORAGE_KEY, {});

  const notificationsRaw =
    raw.notifications &&
    typeof raw.notifications === "object" &&
    !Array.isArray(raw.notifications)
      ? (raw.notifications as Record<string, unknown>)
      : {};

  const scanningRaw =
    raw.scanning &&
    typeof raw.scanning === "object" &&
    !Array.isArray(raw.scanning)
      ? (raw.scanning as Record<string, unknown>)
      : {};

  const appearanceRaw =
    raw.appearance &&
    typeof raw.appearance === "object" &&
    !Array.isArray(raw.appearance)
      ? (raw.appearance as Record<string, unknown>)
      : {};

  const scanInterval: ScanInterval =
    scanningRaw.scanInterval === "hourly" ||
    scanningRaw.scanInterval === "daily" ||
    scanningRaw.scanInterval === "weekly" ||
    scanningRaw.scanInterval === "monthly"
      ? scanningRaw.scanInterval
      : DEFAULT_SETTINGS.scanning.scanInterval;

  const fontSize: FontSize =
    appearanceRaw.fontSize === "small" ||
    appearanceRaw.fontSize === "medium" ||
    appearanceRaw.fontSize === "large"
      ? appearanceRaw.fontSize
      : DEFAULT_SETTINGS.appearance.fontSize;

  const maxConcurrent =
    typeof scanningRaw.maxConcurrent === "number" &&
    Number.isFinite(scanningRaw.maxConcurrent)
      ? Math.max(1, Math.min(100, Math.round(scanningRaw.maxConcurrent)))
      : DEFAULT_SETTINGS.scanning.maxConcurrent;

  const emailRecipients = Array.isArray(notificationsRaw.emailRecipients)
    ? notificationsRaw.emailRecipients
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_SETTINGS.notifications.emailRecipients;

  const autoScanTargets = Array.isArray(scanningRaw.autoScanTargets)
    ? scanningRaw.autoScanTargets
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_SETTINGS.scanning.autoScanTargets;

  return {
    notifications: {
      emailRecipients,
    },
    scanning: {
      autoScan:
        typeof scanningRaw.autoScan === "boolean"
          ? scanningRaw.autoScan
          : DEFAULT_SETTINGS.scanning.autoScan,
      scanInterval,
      maxConcurrent,
      autoScanTargets,
    },
    appearance: {
      fontSize,
      animations:
        typeof appearanceRaw.animations === "boolean"
          ? appearanceRaw.animations
          : DEFAULT_SETTINGS.appearance.animations,
    },
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
