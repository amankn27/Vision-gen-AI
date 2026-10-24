import React from 'react';
import { LayoutDashboard, ScanEye, Sparkles, Clock, Settings as SettingsIcon } from 'lucide-react';
import { NavigationTab } from '../../types';

interface MobileNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const items = [
    { id: 'overview' as NavigationTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze' as NavigationTab, label: 'Analyze', icon: ScanEye },
    { id: 'generate' as NavigationTab, label: 'Generate', icon: Sparkles },
    { id: 'history' as NavigationTab, label: 'History', icon: Clock },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--vg-surface-main)] border-t border-[var(--vg-border)] flex items-center justify-around px-2 z-40"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors cursor-pointer select-none ${
              isActive
                ? 'text-[var(--vg-accent-primary)] font-semibold'
                : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
