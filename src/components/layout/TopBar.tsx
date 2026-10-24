import React from 'react';
import { Sun, Moon, Menu, Activity, ShieldCheck } from 'lucide-react';
import { NavigationTab, ServiceHealth } from '../../types';
import { BrandMark } from '../ui/BrandMark';

interface TopBarProps {
  activeTab: NavigationTab;
  health: ServiceHealth | null;
  theme: string;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onOpenAuth: () => void;
  userName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  health,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onOpenAuth,
  userName,
}) => {
  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Workspace',
      subtitle: 'Multimodal visual studio & recent activity',
    },
    analyze: {
      title: 'Analyze Image',
      subtitle: 'Inspection, OCR, and visual question answering',
    },
    generate: {
      title: 'Generate & Transform',
      subtitle: 'Text-to-image and source-guided transformation',
    },
    history: {
      title: 'History Gallery',
      subtitle: 'Review, reopen, and export previous studio tasks',
    },
    settings: {
      title: 'Studio Settings',
      subtitle: 'Theme preferences, runtime manifest, and storage',
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="h-16 bg-[var(--vg-surface-main)] border-b border-[var(--vg-border)] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left Context & Mobile Menu Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="md:hidden">
          <BrandMark size="sm" showText={false} />
        </div>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-[var(--vg-text-primary)] leading-tight">
            {current.title}
          </h1>
          <p className="hidden sm:block text-xs text-[var(--vg-text-muted)]">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions: Real Service Health Pill + Theme Switcher + Auth Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real Backend Service Health Indicator */}
        {health && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              health.status === 'healthy'
                ? 'bg-[var(--vg-status-success)]/10 text-[var(--vg-status-success)] border-[var(--vg-status-success)]/30'
                : health.status === 'degraded'
                ? 'bg-[var(--vg-status-warning)]/10 text-[var(--vg-status-warning)] border-[var(--vg-status-warning)]/30'
                : 'bg-[var(--vg-status-error)]/10 text-[var(--vg-status-error)] border-[var(--vg-status-error)]/30'
            }`}
            title={`Vision: ${health.models.vision} | Gen: ${health.models.generation}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health.status === 'healthy'
                  ? 'bg-[var(--vg-status-success)] animate-pulse'
                  : health.status === 'degraded'
                  ? 'bg-[var(--vg-status-warning)]'
                  : 'bg-[var(--vg-status-error)]'
              }`}
            />
            <span className="capitalize">{health.status}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-transparent hover:border-[var(--vg-border)] transition-colors cursor-pointer"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Profile Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)] text-xs font-medium text-[var(--vg-text-primary)] transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-[var(--vg-accent-primary)] text-white flex items-center justify-center font-bold text-[10px]">
            {userName ? userName.slice(0, 1).toUpperCase() : 'U'}
          </div>
          <span className="hidden sm:inline-block max-w-[100px] truncate">{userName || 'Account'}</span>
        </button>
      </div>
    </header>
  );
};
