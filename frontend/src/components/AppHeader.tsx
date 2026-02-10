import React from 'react';

interface AppHeaderProps {
  onRefresh: () => void;
}

export default function AppHeader({ onRefresh }: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-10 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md drag">
      {/* LEFT: Logo / Title */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-primary/80 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        <span className="text-sm font-semibold tracking-wide text-foreground/80">
          CipherCert
        </span>
      </div>

      {/* RIGHT: Refresh Button (Padding keeps it away from Windows controls) */}
      <div className="flex items-center pr-36 no-drag">
        <button
          onClick={onRefresh}
          className="group relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground active:scale-95 cursor-pointer"
          title="Reload Data"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="transition-transform duration-500 group-hover:rotate-180"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
      </div>
    </header>
  );
}