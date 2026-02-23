import { loadJson, saveJson } from "./storage";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  schedule?: string;
  targets: string[]; // domains / IPs the rule applies to
}

// Bump storage key because the model changed (prevents old data crashes)
export const AUTOMATION_STORAGE_KEY = "ciphercert_automation_rules_v2";

export const DEFAULT_RULES: AutomationRule[] = [
  {
    id: "1",
    name: "Certificate Expiry Alert",
    trigger: "Certificate expires in 30 days",
    action: "Send email notification",
    enabled: true,
    schedule: "Daily at 9:00 AM",
    targets: [],
  },
  {
    id: "2",
    name: "Weekly Domain Scan",
    trigger: "Every Monday",
    action: "Scan domain",
    enabled: true,
    schedule: "Weekly on Monday",
    targets: [],
  },
];

function normalizeRule(
  value: unknown,
  index: number
): AutomationRule | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const idRaw = record.id;
  const nameRaw = record.name;
  const triggerRaw = record.trigger;
  const actionRaw = record.action;
  const enabledRaw = record.enabled;
  const scheduleRaw = record.schedule;
  const targetsRaw = record.targets;

  const id =
    typeof idRaw === "string" && idRaw.trim()
      ? idRaw
      : `${Date.now()}-${index}`;
  const name =
    typeof nameRaw === "string" && nameRaw.trim() ? nameRaw : "Untitled Rule";
  const trigger =
    typeof triggerRaw === "string" && triggerRaw.trim()
      ? triggerRaw
      : "Manual trigger";
  const action =
    typeof actionRaw === "string" && actionRaw.trim()
      ? actionRaw
      : "Send email notification";
  const enabled = typeof enabledRaw === "boolean" ? enabledRaw : true;
  const schedule =
    typeof scheduleRaw === "string" && scheduleRaw.trim()
      ? scheduleRaw
      : "Manual";
  const targets = Array.isArray(targetsRaw)
    ? targetsRaw
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    id,
    name,
    trigger,
    action,
    enabled,
    schedule,
    targets,
  };
}

export function loadAutomationRules(): AutomationRule[] {
  const stored = loadJson<unknown[]>(AUTOMATION_STORAGE_KEY, DEFAULT_RULES);
  if (!Array.isArray(stored)) return DEFAULT_RULES;

  const normalized = stored
    .map((rule, index) => normalizeRule(rule, index))
    .filter((rule): rule is AutomationRule => rule !== null);

  return normalized.length > 0 ? normalized : DEFAULT_RULES;
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  saveJson(AUTOMATION_STORAGE_KEY, rules);
}
