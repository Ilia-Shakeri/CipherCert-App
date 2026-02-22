import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner@2.0.3';
import { Bell, Key, Database, Eye, EyeOff, Send } from 'lucide-react';
import type { AppSettings } from '../lib/settings';
import { TargetPicker } from './TargetPicker';
import type { AppSettings } from '../lib/settings';

interface SettingsPageProps {
  isDark: boolean;
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
}

function isValidEmail(v: string): boolean {
  // Simple pragmatic email check (good enough for UI)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function SettingsPage({
  isDark,
  settings,
  setSettings,
}: SettingsPageProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const recipientsText = useMemo(
    () => settings.notifications.emailRecipients.join(', '),
    [settings.notifications.emailRecipients]
  );

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(settings.apiKey);
      toast.success('API key copied to clipboard');
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  const handleRegenerateApiKey = () => {
    // Demo key generator (client-side). Replace with real backend issuance later.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setSettings((prev) => ({ ...prev, apiKey: `sk_live_${token}` }));
    toast.success('Generated new API key');
  };

  const addRecipient = (email: string) => {
    const v = email.trim();
    if (!isValidEmail(v)) {
      toast.error('Invalid email');
      return;
    }
    setSettings((prev) => {
      const next = Array.from(
        new Set([...prev.notifications.emailRecipients, v])
      );
      return {
        ...prev,
        notifications: { ...prev.notifications, emailRecipients: next },
      };
    });
  };

  const removeRecipient = (email: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        emailRecipients: prev.notifications.emailRecipients.filter(
          (x) => x !== email
        ),
      },
    }));
  };

  const handleSendTestEmail = async () => {
    if (!settings.notifications.emailRecipients.length) {
      toast.error('Add at least one recipient email first');
      return;
    }

    const toastId = toast.loading('Sending test email...');
    try {
      const res = await fetch(
        'http://127.0.0.1:8000/api/notifications/email/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: settings.notifications.emailRecipients,
            subject: 'CipherCert Test Notification',
            body: 'This is a test notification from CipherCert.',
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.detail || 'Email send failed', { id: toastId });
        return;
      }
      toast.success('Test email sent', { id: toastId });
    } catch {
      toast.error('Could not connect to backend', { id: toastId });
    }
  };

  const SettingSection = ({
    icon: Icon,
    title,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
  }) => (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: isDark
          ? 'rgba(15, 23, 42, 0.5)'
          : 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(20px)',
        borderColor: isDark
          ? 'rgba(34, 211, 238, 0.2)'
          : 'rgba(8, 145, 178, 0.2)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(34, 211, 238, 0.2)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
          }}
        >
          <Icon className="w-5 h-5" style={{ color: '#22D3EE' }} />
        </div>
        <h3
          className="font-bold"
          style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontSize: '20px' }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="mb-2"
            style={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: '36px',
              fontWeight: 'bold',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Settings
          </h1>
          <p style={{ color: isDark ? '#64748B' : '#94A3B8' }}>
            Configure automation + notifications
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 mt-6 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
            color: '#0F172A',
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
          }}
        >
          Save Changes
        </button>
      </div>

      {/* Notifications: Email only */}
      <SettingSection icon={Bell} title="Email Notifications">
        <div className="space-y-4">
          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Recipient Emails
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type email and press Enter"
                className="flex-1 px-4 py-3 rounded-xl border bg-transparent outline-none"
                style={{
                  borderColor: isDark
                    ? 'rgba(34, 211, 238, 0.2)'
                    : 'rgba(8, 145, 178, 0.2)',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.currentTarget.value || '').trim();
                    if (v) addRecipient(v);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={handleSendTestEmail}
                className="px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(34, 211, 238, 0.12)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  color: '#22D3EE',
                }}
                title="Send a test email"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {settings.notifications.emailRecipients.length === 0 ? (
                <div
                  className="text-sm"
                  style={{ color: isDark ? '#64748B' : '#94A3B8' }}
                >
                  No recipients yet.
                </div>
              ) : (
                settings.notifications.emailRecipients.map((email) => (
                  <div
                    key={email}
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
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      style={{ color: '#EF4444' }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div
              className="mt-2 text-xs"
              style={{ color: isDark ? '#64748B' : '#94A3B8' }}
            >
              Current: {recipientsText || '(none)'}
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Scanning */}
      <SettingSection icon={Database} title="Scanning">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-medium"
                style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}
              >
                Auto Scan
              </p>
              <p
                className="text-sm"
                style={{ color: isDark ? '#64748B' : '#94A3B8' }}
              >
                Automatically scan selected domains/IPs on schedule
              </p>
            </div>

            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  scanning: {
                    ...prev.scanning,
                    autoScan: !prev.scanning.autoScan,
                  },
                }))
              }
              className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: settings.scanning.autoScan
                  ? '#22D3EE'
                  : isDark
                    ? '#334155'
                    : '#CBD5E1',
              }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                style={{
                  left: settings.scanning.autoScan
                    ? 'calc(100% - 26px)'
                    : '2px',
                }}
              />
            </button>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Scan Interval
            </label>
            <select
              value={settings.scanning.scanInterval}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  scanning: {
                    ...prev.scanning,
                    scanInterval: e.target
                      .value as AppSettings['scanning']['scanInterval'],
                  },
                }))
              }
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none cursor-pointer"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              }}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Max Concurrent Scans
            </label>
            <input
              type="number"
              value={settings.scanning.maxConcurrent}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                setSettings((prev) => ({
                  ...prev,
                  scanning: {
                    ...prev.scanning,
                    maxConcurrent: Number.isFinite(n)
                      ? Math.max(1, Math.min(100, n))
                      : 1,
                  },
                }));
              }}
              min="1"
              max="100"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark
                  ? 'rgba(34, 211, 238, 0.2)'
                  : 'rgba(8, 145, 178, 0.2)',
                color: isDark ? '#FFFFFF' : '#0F172A',
              }}
            />
          </div>

          <TargetPicker
            isDark={isDark}
            label="Auto Scan Targets (Domains / IPs)"
            helperText="Pick the domains/IPs that should be scanned automatically."
            value={settings.scanning.autoScanTargets}
            onChange={(autoScanTargets) =>
              setSettings((prev) => ({
                ...prev,
                scanning: { ...prev.scanning, autoScanTargets },
              }))
            }
          />
        </div>
      </SettingSection>

      {/* API */}
      <SettingSection icon={Key} title="API Access">
        <div className="space-y-4">
          <div>
            <label
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              API Key
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none font-mono pr-12"
                  style={{
                    borderColor: isDark
                      ? 'rgba(34, 211, 238, 0.2)'
                      : 'rgba(8, 145, 178, 0.2)',
                    color: isDark ? '#CBD5E1' : '#475569',
                  }}
                />
                <button
                  onClick={() => setShowApiKey((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                  title={showApiKey ? 'Hide' : 'Show'}
                >
                  {showApiKey ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <button
                onClick={handleCopyApiKey}
                className="px-4 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  color: '#22D3EE',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                }}
              >
                Copy
              </button>

              <button
                onClick={handleRegenerateApiKey}
                className="px-4 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}
