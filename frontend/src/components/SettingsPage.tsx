import { useState } from "react";
import { User, Bell, Key, Database, Palette, Globe } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface SettingsPageProps {
  isDark: boolean;
}

export function SettingsPage({ isDark }: SettingsPageProps) {
  const [settings, setSettings] = useState({
    username: "admin",
    email: "admin@ciphercert.com",
    notifications: {
      email: true,
      slack: false,
      webhook: false
    },
    scanning: {
      autoScan: true,
      scanInterval: "daily",
      maxConcurrent: 10
    },
    appearance: {
      accentColor: "#22D3EE",
      fontSize: "medium",
      animations: true
    }
  });

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  const SettingSection = ({ 
    icon: Icon, 
    title, 
    children 
  }: { 
    icon: React.ElementType; 
    title: string; 
    children: React.ReactNode 
  }) => (
    <div 
      className="rounded-2xl p-6 border"
      style={{
        background: isDark 
          ? "rgba(15, 23, 42, 0.5)" 
          : "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(20px)",
        borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)"
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: "rgba(34, 211, 238, 0.2)",
            border: "1px solid rgba(34, 211, 238, 0.3)"
          }}
        >
          <Icon className="w-5 h-5" style={{ color: "#22D3EE" }} />
        </div>
        <h3 
          className="font-bold"
          style={{ 
            color: isDark ? "#FFFFFF" : "#0F172A",
            fontSize: "20px"
          }}
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
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "36px",
              fontWeight: "bold",
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            Settings
          </h1>
          <p style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
            Customize your CipherCert experience
          </p>
        </div>
        
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
            color: "#0F172A",
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)"
          }}
        >
          Save Changes
        </button>
      </div>

      {/* Profile Settings */}
      <SettingSection icon={User} title="Profile">
        <div className="space-y-4">
          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Username
            </label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => setSettings({ ...settings, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            />
          </div>
          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            />
          </div>
        </div>
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection icon={Bell} title="Notifications">
        <div className="space-y-4">
          {[
            { key: "email", label: "Email Notifications", description: "Receive alerts via email" },
            { key: "slack", label: "Slack Integration", description: "Send notifications to Slack" },
            { key: "webhook", label: "Webhook Alerts", description: "Trigger webhooks for events" }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p 
                  className="font-medium"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {label}
                </p>
                <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                  {description}
                </p>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  notifications: {
                    ...settings.notifications,
                    [key]: !settings.notifications[key as keyof typeof settings.notifications]
                  }
                })}
                className="relative w-14 h-7 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: settings.notifications[key as keyof typeof settings.notifications]
                    ? "#22D3EE"
                    : (isDark ? "#334155" : "#CBD5E1")
                }}
              >
                <div 
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                  style={{
                    left: settings.notifications[key as keyof typeof settings.notifications]
                      ? "calc(100% - 26px)"
                      : "2px"
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Scanning Settings */}
      <SettingSection icon={Database} title="Scanning">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="font-medium"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                Auto Scan
              </p>
              <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                Automatically scan domains on schedule
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                scanning: { ...settings.scanning, autoScan: !settings.scanning.autoScan }
              })}
              className="relative w-14 h-7 rounded-full transition-all duration-300"
              style={{
                backgroundColor: settings.scanning.autoScan ? "#22D3EE" : (isDark ? "#334155" : "#CBD5E1")
              }}
            >
              <div 
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                style={{
                  left: settings.scanning.autoScan ? "calc(100% - 26px)" : "2px"
                }}
              />
            </button>
          </div>

          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Scan Interval
            </label>
            <select
              value={settings.scanning.scanInterval}
              onChange={(e) => setSettings({
                ...settings,
                scanning: { ...settings.scanning, scanInterval: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A",
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF"
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
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Max Concurrent Scans
            </label>
            <input
              type="number"
              value={settings.scanning.maxConcurrent}
              onChange={(e) => setSettings({
                ...settings,
                scanning: { ...settings.scanning, maxConcurrent: parseInt(e.target.value) }
              })}
              min="1"
              max="100"
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            />
          </div>
        </div>
      </SettingSection>

      {/* Appearance Settings */}
      <SettingSection icon={Palette} title="Appearance">
        <div className="space-y-4">
          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Accent Color
            </label>
            <div className="flex gap-3">
              {["#22D3EE", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"].map(color => (
                <button
                  key={color}
                  onClick={() => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, accentColor: color }
                  })}
                  className="w-12 h-12 rounded-xl transition-all duration-300 hover:scale-110"
                  style={{
                    backgroundColor: color,
                    border: settings.appearance.accentColor === color 
                      ? "3px solid white"
                      : "none",
                    boxShadow: `0 0 20px ${color}40`
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              Font Size
            </label>
            <select
              value={settings.appearance.fontSize}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, fontSize: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none"
              style={{
                borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                color: isDark ? "#FFFFFF" : "#0F172A",
                backgroundColor: isDark ? "#0F172A" : "#FFFFFF"
              }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p 
                className="font-medium"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                Animations
              </p>
              <p className="text-sm" style={{ color: isDark ? "#64748B" : "#94A3B8" }}>
                Enable smooth transitions and effects
              </p>
            </div>
            <button
              onClick={() => setSettings({
                ...settings,
                appearance: { ...settings.appearance, animations: !settings.appearance.animations }
              })}
              className="relative w-14 h-7 rounded-full transition-all duration-300"
              style={{
                backgroundColor: settings.appearance.animations ? "#22D3EE" : (isDark ? "#334155" : "#CBD5E1")
              }}
            >
              <div 
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                style={{
                  left: settings.appearance.animations ? "calc(100% - 26px)" : "2px"
                }}
              />
            </button>
          </div>
        </div>
      </SettingSection>

      {/* API Settings */}
      <SettingSection icon={Key} title="API Access">
        <div className="space-y-4">
          <div>
            <label 
              className="block mb-2 text-sm font-semibold"
              style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            >
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 px-4 py-3 rounded-xl border bg-transparent outline-none font-mono"
                style={{
                  borderColor: isDark ? "rgba(34, 211, 238, 0.2)" : "rgba(8, 145, 178, 0.2)",
                  color: isDark ? "#64748B" : "#94A3B8"
                }}
              />
              <button
                onClick={() => toast.success("API key copied to clipboard")}
                className="px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{
                  backgroundColor: "rgba(34, 211, 238, 0.1)",
                  color: "#22D3EE",
                  border: "1px solid rgba(34, 211, 238, 0.3)"
                }}
              >
                Copy
              </button>
              <button
                onClick={() => toast.success("Generating new API key...")}
                className="px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)"
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
