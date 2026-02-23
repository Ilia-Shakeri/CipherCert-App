import { useEffect, useMemo, useState } from 'react';
import {
  Info,
  Copy,
  Github,
  Linkedin,
  Send,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { openExternal } from '../lib/external';
import { notifyError, notifySuccess } from '../lib/notify';

interface AboutPageProps {
  isDark: boolean;
}

interface AppInfo {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
}

interface AuthorLink {
  label: string;
  url: string;
  Icon: LucideIcon;
}

const AUTHOR_LINKS: AuthorLink[] = [
  { label: 'GitHub', url: 'https://github.com/your-username', Icon: Github },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/your-profile',
    Icon: Linkedin,
  },
  { label: 'Telegram', url: 'https://t.me/your-handle', Icon: Send },
  { label: 'Website', url: 'https://your-site.example.com', Icon: Globe },
];

export function AboutPage({ isDark }: AboutPageProps) {
  const [appInfo, setAppInfo] = useState<AppInfo>({
    appVersion: 'unknown',
    electronVersion: 'not available',
    nodeVersion: 'not available',
    platform: navigator.platform || 'unknown',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const maybeRequire = (window as unknown as { require?: Function }).require;
        if (!maybeRequire) return;

        const electron = maybeRequire('electron') as {
          ipcRenderer?: {
            invoke?: (channel: string) => Promise<Partial<AppInfo> | undefined>;
          };
        };

        if (!electron.ipcRenderer?.invoke) return;
        const info = await electron.ipcRenderer.invoke('get-app-info');
        if (!info) return;

        setAppInfo((prev) => ({
          appVersion: info.appVersion || prev.appVersion,
          electronVersion: info.electronVersion || prev.electronVersion,
          nodeVersion: info.nodeVersion || prev.nodeVersion,
          platform: info.platform || prev.platform,
        }));
      } catch (error) {
        console.error('Failed to load app info', error);
      }
    };

    void load();
  }, []);

  const frontendVersion = import.meta.env.VITE_APP_VERSION || 'dev';
  const buildMode = import.meta.env.MODE || 'development';
  const buildStamp = import.meta.env.VITE_BUILD_TIME || 'local build';

  const diagnostics = useMemo(
    () =>
      [
        `appVersion=${appInfo.appVersion}`,
        `frontendVersion=${frontendVersion}`,
        `buildMode=${buildMode}`,
        `buildStamp=${buildStamp}`,
        `electronVersion=${appInfo.electronVersion}`,
        `nodeVersion=${appInfo.nodeVersion}`,
        `platform=${appInfo.platform}`,
      ].join('\n'),
    [
      appInfo.appVersion,
      appInfo.electronVersion,
      appInfo.nodeVersion,
      appInfo.platform,
      frontendVersion,
      buildMode,
      buildStamp,
    ]
  );

  const handleCopyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnostics);
      notifySuccess('Diagnostics copied');
    } catch (error) {
      notifyError('Could not copy diagnostics', error);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        title="About"
        subtitle="Product info, author links, and diagnostics"
        isDark={isDark}
        pageKey="about"
        showHelp={false}
        actions={
          <button
            onClick={() => void handleCopyDiagnostics()}
            className="px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-2 cursor-pointer"
            style={{
              background: isDark
                ? 'rgba(34, 211, 238, 0.12)'
                : 'rgba(8, 145, 178, 0.12)',
              border: isDark
                ? '1px solid rgba(34, 211, 238, 0.3)'
                : '1px solid rgba(8, 145, 178, 0.3)',
              color: '#22D3EE',
            }}
          >
            <Copy className="w-4 h-4" />
            Copy Diagnostics
          </button>
        }
      />

      <div
        className="rounded-2xl p-6 border"
        style={{
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(8, 145, 178, 0.2)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(34, 211, 238, 0.2)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
            }}
          >
            <Info className="w-5 h-5" style={{ color: '#22D3EE' }} />
          </div>
          <h2
            style={{
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            CipherCert
          </h2>
        </div>
        <p style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
          CipherCert is an SSL and domain intelligence desktop dashboard focused on
          rapid scans, history visibility, and practical automation workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(8, 145, 178, 0.2)',
          }}
        >
          <h3
            className="mb-3"
            style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 700 }}
          >
            Core Features
          </h3>
          <div
            className="space-y-2 text-sm"
            style={{ color: isDark ? '#CBD5E1' : '#475569' }}
          >
            <div>- Real-time SSL/domain scanning</div>
            <div>- Historical scan records with export</div>
            <div>- Bulk scan workflows</div>
            <div>- Rule-based automation management</div>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 border"
          style={{
            background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(8, 145, 178, 0.2)',
          }}
        >
          <h3
            className="mb-3"
            style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 700 }}
          >
            Author
          </h3>
          <p className="mb-4 text-sm" style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Ilia Shakeri | Product Developer
          </p>
          <div className="flex flex-wrap gap-3">
            {AUTHOR_LINKS.map((link) => {
              const Icon = link.Icon;
              return (
                <button
                  key={link.label}
                  onClick={() => void openExternal(link.url)}
                  className="w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer"
                  aria-label={link.label}
                  title={link.label}
                  style={{
                    background: isDark
                      ? 'rgba(34, 211, 238, 0.12)'
                      : 'rgba(8, 145, 178, 0.12)',
                    border: isDark
                      ? '1px solid rgba(34, 211, 238, 0.26)'
                      : '1px solid rgba(8, 145, 178, 0.26)',
                    color: isDark ? '#22D3EE' : '#0891B2',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-6 border"
        style={{
          background: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px)',
          borderColor: isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(8, 145, 178, 0.2)',
        }}
      >
        <h3
          className="mb-3"
          style={{ color: isDark ? '#FFFFFF' : '#0F172A', fontWeight: 700 }}
        >
          Version and Build
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            App Version: <strong>{appInfo.appVersion}</strong>
          </div>
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Frontend Version: <strong>{frontendVersion}</strong>
          </div>
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Electron: <strong>{appInfo.electronVersion}</strong>
          </div>
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Node: <strong>{appInfo.nodeVersion}</strong>
          </div>
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Platform: <strong>{appInfo.platform}</strong>
          </div>
          <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
            Build: <strong>{buildMode} ({buildStamp})</strong>
          </div>
        </div>
      </div>
    </div>
  );
}