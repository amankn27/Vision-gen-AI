import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { NavigationTab, ServiceHealth, UserProfile } from '../../types';
import { BrandMark } from '../ui/BrandMark';
import { X, LayoutDashboard, ScanEye, Sparkles, Clock, Settings } from 'lucide-react';

interface AppShellProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  health: ServiceHealth | null;
  theme: string;
  onToggleTheme: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onNewSession: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  health,
  theme,
  onToggleTheme,
  user,
  onOpenAuth,
  onNewSession,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze' as NavigationTab, label: 'Analyze Image', icon: ScanEye },
    { id: 'generate' as NavigationTab, label: 'Generate & Transform', icon: Sparkles },
    { id: 'history' as NavigationTab, label: 'History Gallery', icon: Clock },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[var(--vg-bg-app)] text-[var(--vg-text-primary)] overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onNewSession={onNewSession}
        user={user}
        onOpenAuth={onOpenAuth}
      />

      {/* Mobile Slide-Over Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-72 bg-[var(--vg-surface-main)] h-full p-4 flex flex-col border-r border-[var(--vg-border)] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--vg-border)]">
              <BrandMark size="sm" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] font-semibold border border-[var(--vg-accent-primary)]/30'
                        : 'text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)]'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[var(--vg-border)]">
              <button
                onClick={() => {
                  onOpenAuth();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] cursor-pointer text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--vg-text-primary)]">
                    {user ? user.name : 'Sign In'}
                  </p>
                  <p className="text-[11px] text-[var(--vg-text-muted)]">
                    {user ? user.email : 'Local Account'}
                  </p>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          activeTab={activeTab}
          health={health}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAuth={onOpenAuth}
          userName={user?.name}
        />

        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 focus:outline-none" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
