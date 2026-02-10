import { useState, useEffect } from "react";
import { GlassSidebar } from "./components/GlassSidebar";
import { DashboardPage } from "./components/DashboardPage";
import { BulkScanPage } from "./components/BulkScanPage";
import { HistoryPage } from "./components/HistoryPage";
import { AutomationPage } from "./components/AutomationPage";
import { SettingsPage } from "./components/SettingsPage";
import { Toaster } from "sonner";
import AppHeader from './components/AppHeader';

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // همگام‌سازی تم با الکترون
  useEffect(() => {
    // @ts-ignore
    if (window.require) {
      try {
        // @ts-ignore
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('theme-changed', isDark ? 'dark' : 'light');
      } catch (error) {
        console.log("Browser mode");
      }
    }
  }, [isDark]);

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardPage isDark={isDark} />;
      case "bulk-scan": return <BulkScanPage isDark={isDark} />;
      case "history": return <HistoryPage isDark={isDark} />;
      case "automation": return <AutomationPage isDark={isDark} />;
      case "settings": return <SettingsPage isDark={isDark} />;
      default: return <DashboardPage isDark={isDark} />;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div 
        className="relative min-h-screen overflow-hidden"
        style={{ 
          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
          fontFamily: "'Inter', 'JetBrains Mono', -apple-system, system-ui, sans-serif"
        }}
      >
        {/* --- پس‌زمینه --- */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: isDark
              ? `radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.08) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)`
              : `radial-gradient(circle at 20% 30%, rgba(8, 145, 178, 0.05) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(34, 211, 238, 0.04) 0%, transparent 50%)`
          }}
        />

        {/* --- لایه محافظ درگ (Safety Drag Layer) --- */}
        {/* اگر هدر کار نکرد، این نوار نامرئی بالای صفحه همیشه پنجره را جابجا می‌کند */}
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '40px',
          zIndex: 9999, // بالاترین اولویت
          WebkitAppRegion: 'drag',
          pointerEvents: 'none' // اجازه می‌دهد کلیک‌ها رد شوند و به دکمه‌ها برسند
        }} />

        {/* --- هدر برنامه --- */}
        <div className="fixed top-0 left-0 right-0 z-50">
           <AppHeader onRefresh={handleRefresh} />
        </div>

        {/* --- بدنه اصلی برنامه --- */}
        {/* پدینگ بالا (pt-12) باعث می‌شود محتوا زیر هدر نرود */}
        <div className="flex h-screen pt-10 relative z-10">
          
          {/* سایدبار */}
          <div className="h-full">
             <GlassSidebar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isDark={isDark}
              onThemeToggle={() => setIsDark(!isDark)}
            />
          </div>

          {/* محتوای صفحات */}
          <div className="flex-1 overflow-auto p-6">
            {renderPage()}
          </div>
        </div>

        <Toaster 
          position="bottom-left"
          theme={isDark ? "dark" : "light"}
          richColors
        />
      </div>
    </div>
  );
}