import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  Sparkles,
  Clock,
  Settings as SettingsIcon,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
} from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { NavigationTab, UserProfile } from '../../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewSession: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  onNewSession,
  user,
  onOpenAuth,
}) => {
  const navItems = [
    { id: 'overview' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze' as NavigationTab, label: 'Analyze Image', icon: ScanEye },
    { id: 'generate' as NavigationTab, label: 'Generate', icon: Sparkles },
    { id: 'history' as NavigationTab, label: 'History', icon: Clock },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`hidden md:flex flex-col bg-[var(--vg-surface-main)] border-r border-[var(--vg-border)] transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-60'
      }`}
    >
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--vg-border)]">
        <BrandMark size="sm" showText={!isCollapsed} />
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] transition-colors cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          title="Start new image session"
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--vg-accent-primary)] text-white hover:bg-[var(--vg-accent-primary-hover)] active:scale-[0.98] font-medium transition-all shadow-xs cursor-pointer ${
            isCollapsed ? 'h-10 px-0' : 'h-10 px-3 text-sm'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>New Session</span>}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] font-semibold border border-[var(--vg-accent-primary)]/30'
                  : 'text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Account / User Section */}
      <div className="p-3 border-t border-[var(--vg-border)]">
        <button
          onClick={onOpenAuth}
          title={user ? `${user.name} (${user.email})` : 'Sign In'}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--vg-surface-hover)] transition-colors text-left cursor-pointer border border-transparent hover:border-[var(--vg-border)] ${
            isCollapsed ? 'justify-center p-2' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] flex items-center justify-center text-[var(--vg-accent-primary)] shrink-0 font-bold text-xs">
            {user ? user.name.slice(0, 1).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--vg-text-primary)] truncate">
                {user ? user.name : 'Sign In'}
              </p>
              <p className="text-[11px] text-[var(--vg-text-muted)] truncate">
                {user ? user.email : 'Local Studio'}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
