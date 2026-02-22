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

export function loadAutomationRules(): AutomationRule[] {
  return loadJson<AutomationRule[]>(AUTOMATION_STORAGE_KEY, DEFAULT_RULES);
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  saveJson(AUTOMATION_STORAGE_KEY, rules);
}