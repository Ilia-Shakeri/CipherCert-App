export async function openExternal(url: string): Promise<void> {
  const target = url.trim();
  if (!target) return;

  try {
    const maybeRequire = (window as unknown as { require?: Function }).require;
    if (maybeRequire) {
      const electron = maybeRequire('electron') as {
        ipcRenderer?: { invoke?: (channel: string, payload?: string) => Promise<unknown> };
        shell?: { openExternal?: (targetUrl: string) => Promise<void> };
      };

      if (electron.ipcRenderer?.invoke) {
        await electron.ipcRenderer.invoke('open-external', target);
        return;
      }

      if (electron.shell?.openExternal) {
        await electron.shell.openExternal(target);
        return;
      }
    }
  } catch (error) {
    console.error('Failed to open external URL via Electron API', error);
  }

  window.open(target, '_blank', 'noopener,noreferrer');
}

