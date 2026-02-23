export type HelpPageKey =
  | 'dashboard'
  | 'bulk-scan'
  | 'history'
  | 'automation'
  | 'settings'
  | 'donate'
  | 'about';

export interface HelpEntry {
  title: string;
  body: string;
  learnMoreUrl?: string;
}

const FALLBACK_HELP: HelpEntry = {
  title: 'Help',
  body: 'Help content is not available yet for this page.',
};

export const HELP_CONTENT: Record<HelpPageKey, HelpEntry> = {
  dashboard: {
    title: 'Dashboard Help',
    body:
      'Use the search bar to scan a domain or IP.\n' +
      '- Enter a target and press Scan.\n' +
      '- Review latest scan rows in the table.\n' +
      '- Status cards summarize secure, expired, and score trends.',
  },
  'bulk-scan': {
    title: 'Bulk Scan Help',
    body:
      'Bulk scan processes targets from a .txt file.\n' +
      '- Drag and drop a .txt file.\n' +
      '- Confirm preview targets.\n' +
      '- Start scan and watch progress.\n' +
      '- Review successful and failed targets in result panels.',
  },
  history: {
    title: 'History Help',
    body:
      'History shows all previously scanned targets from backend storage.\n' +
      '- Use search to filter by domain or issuer.\n' +
      '- Export to CSV or PDF.\n' +
      '- Refresh to fetch latest entries.\n' +
      '- Clear removes all history records.',
  },
  automation: {
    title: 'Automation Help',
    body:
      'Automation rules are currently local UI rules.\n' +
      '- Create rule with trigger, action, schedule, and targets.\n' +
      '- Edit or delete existing rules.\n' +
      '- Toggle rules on/off.\n' +
      '- Backend scheduler wiring can be added later.',
  },
  settings: {
    title: 'Settings Help',
    body:
      'Settings control notifications and scanning behavior.\n' +
      '- Add email recipients for alerts.\n' +
      '- Send a test email to verify delivery.\n' +
      '- Configure scan interval and concurrency.\n' +
      '- Pick auto-scan targets.',
  },
  donate: {
    title: 'Donate Help',
    body:
      'Support development using the listed wallet addresses.\n' +
      '- Flip a card to view address.\n' +
      '- Use Copy Address for quick transfer.\n' +
      '- Tap QR to expand for wallet scanning.',
  },
  about: {
    title: 'About Help',
    body:
      'About shows product and runtime diagnostics.\n' +
      '- View app/frontend versions.\n' +
      '- Open author/project links.\n' +
      '- Copy diagnostics when reporting issues.',
  },
};

export function getHelpEntry(pageKey: string): HelpEntry {
  return (HELP_CONTENT as Record<string, HelpEntry>)[pageKey] ?? FALLBACK_HELP;
}

