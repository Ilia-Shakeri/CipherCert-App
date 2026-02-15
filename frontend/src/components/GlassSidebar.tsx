import {
  LayoutDashboard,
  Upload,
  Clock,
  Settings,
  Bell,
  Heart,
} from 'lucide-react';
import { GlassThemeToggle } from './GlassThemeToggle';
import logoImage from '../assets/logo.png';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface GlassSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function GlassSidebar({
  activeTab,
  onTabChange,
  isDark,
  onThemeToggle,
}: GlassSidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'bulk-scan',
      label: 'Bulk Scan',
      icon: <Upload className="w-5 h-5" />,
    },
    { id: 'history', label: 'History', icon: <Clock className="w-5 h-5" /> },
    {
      id: 'automation',
      label: 'Automation',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const bottomMenuItem: MenuItem = {
    id: 'donate',
    label: 'Donate',
    icon: <Heart className="w-5 h-5" />,
  };

  return (
    <div
      className="w-[240px] h-screen flex flex-col relative"
      style={{
        background: isDark
          ? 'rgba(15, 23, 42, 0.7)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRight: isDark
          ? '1px solid rgba(34, 211, 238, 0.1)'
          : '1px solid rgba(203, 213, 225, 0.3)',
      }}
    >
      {/* Glow Effect */}
      <div
        className="absolute top-0 left-0 w-full h-32 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top, rgba(34, 211, 238, 0.05), transparent 70%)',
        }}
      />

      {/* Logo Section */}
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="CipherCert Logo" className="w-12 h-12" />
          <div>
            <h1
              className="font-bold tracking-tight"
              style={{
                color: isDark ? '#22D3EE' : '#0891B2',
                fontSize: '20px',
                fontFamily: "'JetBrains Mono', 'Inter', monospace",
              }}
            >
              CipherCert
            </h1>
            <p
              className="text-xs"
              style={{ color: isDark ? '#64748B' : '#94A3B8' }}
            >
              SSL Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 relative z-10">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative group"
              style={{
                backgroundColor:
                  activeTab === item.id
                    ? isDark
                      ? 'rgba(34, 211, 238, 0.1)'
                      : 'rgba(8, 145, 178, 0.1)'
                    : 'transparent',
                color:
                  activeTab === item.id
                    ? '#22D3EE'
                    : isDark
                      ? '#94A3B8'
                      : '#64748B',
              }}
            >
              {/* Active glow border */}
              {activeTab === item.id && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                  style={{
                    background: 'linear-gradient(to bottom, #22D3EE, #06B6D4)',
                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                  }}
                />
              )}

              <div className="flex items-center gap-3">
                <div className={activeTab === item.id ? 'text-cyan-400' : ''}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </div>

              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle at center, rgba(34, 211, 238, 0.05), transparent 70%)'
                    : 'radial-gradient(circle at center, rgba(8, 145, 178, 0.05), transparent 70%)',
                }}
              />
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Section - Donate Button + Theme Toggle */}
      <div className="relative z-10">
        {/* Donate Button */}
        <div className="px-3 mb-3">
          <button
            onClick={() => onTabChange(bottomMenuItem.id)}
            className="w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden"
            style={{
              backgroundColor:
                activeTab === bottomMenuItem.id
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'transparent',
              color:
                activeTab === bottomMenuItem.id
                  ? '#EF4444'
                  : isDark
                    ? '#94A3B8'
                    : '#64748B',
              border:
                activeTab === bottomMenuItem.id
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid transparent',
            }}
          >
            {/* Active glow border */}
            {activeTab === bottomMenuItem.id && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                style={{
                  background: 'linear-gradient(to bottom, #EF4444, #DC2626)',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
                }}
              />
            )}

            <div className="flex items-center gap-3">
              <Heart
                className="w-5 h-5 transition-all duration-300 heart-icon"
                style={{
                  color:
                    activeTab === bottomMenuItem.id
                      ? '#EF4444'
                      : isDark
                        ? '#94A3B8'
                        : '#64748B',
                  fill: activeTab === bottomMenuItem.id ? '#EF4444' : 'none',
                }}
              />
              <span className="font-medium">{bottomMenuItem.label}</span>
            </div>

            {/* Hover glow - RED */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(239, 68, 68, 0.08), transparent 70%)',
              }}
            />

            {/* Animated Heart Fill on Hover */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
              button:hover .heart-icon {
                fill: #EF4444;
                animation: heartBeat 0.6s ease-in-out;
              }
              @keyframes heartBeat {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.1); }
                50% { transform: scale(0.95); }
                75% { transform: scale(1.05); }
              }
            `,
              }}
            />
          </button>
        </div>

        {/* Theme Toggle */}
        <div
          className="p-6"
          style={{
            borderTop: isDark
              ? '1px solid rgba(34, 211, 238, 0.1)'
              : '1px solid rgba(203, 213, 225, 0.3)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium"
              style={{ color: isDark ? '#94A3B8' : '#64748B' }}
            >
              Theme
            </span>
          </div>
          <GlassThemeToggle isDark={isDark} onToggle={onThemeToggle} />
        </div>
      </div>
    </div>
  );
}
