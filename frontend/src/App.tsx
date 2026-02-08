import { useState } from "react";
import { GlassSidebar } from "./components/GlassSidebar";
import { DashboardPage } from "./components/DashboardPage";
import { BulkScanPage } from "./components/BulkScanPage";
import { HistoryPage } from "./components/HistoryPage";
import { AutomationPage } from "./components/AutomationPage";
import { SettingsPage } from "./components/SettingsPage";
import { Toaster } from "sonner@2.0.3";

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage isDark={isDark} />;
      case "bulk-scan":
        return <BulkScanPage isDark={isDark} />;
      case "history":
        return <HistoryPage isDark={isDark} />;
      case "automation":
        return <AutomationPage isDark={isDark} />;
      case "settings":
        return <SettingsPage isDark={isDark} />;
      default:
        return <DashboardPage isDark={isDark} />;
    }
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div 
        className="flex min-h-screen relative overflow-hidden"
        style={{ 
          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
          fontFamily: "'Inter', 'JetBrains Mono', -apple-system, system-ui, sans-serif"
        }}
      >
        {/* Background Mesh Gradient */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            background: isDark
              ? `
                radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(34, 211, 238, 0.05) 0%, transparent 50%)
              `
              : `
                radial-gradient(circle at 20% 30%, rgba(8, 145, 178, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.04) 0%, transparent 50%)
              `
          }}
        />

        {/* Sidebar */}
        <GlassSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDark={isDark}
          onThemeToggle={() => setIsDark(!isDark)}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto relative z-10">
          {renderPage()}
        </div>

        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          theme={isDark ? "dark" : "light"}
          richColors
        />
      </div>
    </div>
  );
}
