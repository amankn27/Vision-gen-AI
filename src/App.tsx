import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { OverviewView } from './features/overview/OverviewView';
import { AnalyzeView } from './features/analysis/AnalyzeView';
import { GenerateView } from './features/generation/GenerateView';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';
import { AuthModal } from './features/auth/AuthModal';
import { NavigationTab, ServiceHealth, UserProfile, ThemeMode } from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Cross-screen handover state
  const [pendingAnalysisFile, setPendingAnalysisFile] = useState<File | null>(null);
  const [transformSourceImage, setTransformSourceImage] = useState<string | null>(null);
  const [transformPromptHint, setTransformPromptHint] = useState<string | null>(null);

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('visiongen_theme') as ThemeMode;
    return saved || 'dark';
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('visiongen_theme', theme);
  }, [theme]);

  // Load initial health and user profile on mount
  useEffect(() => {
    api
      .getHealth()
      .then((h) => setHealth(h))
      .catch((err) => {
        console.warn('Initial health check failed:', err);
        setHealth({
          status: 'offline',
          apiAvailable: false,
          models: { vision: 'Qwen/Qwen3.8-27B', generation: '@cf/black-forest-labs/flux-2-klein-4b', transformation: '@cf/black-forest-labs/flux-2-klein-4b' },
          maxUploadMb: 20,
        });
      });

    api
      .getCurrentUser()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null));
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleStartNewSession = () => {
    setPendingAnalysisFile(null);
    setTransformSourceImage(null);
    setTransformPromptHint(null);
    setActiveTab('analyze');
  };

  const handleImageSelectedForAnalysis = (file: File) => {
    setPendingAnalysisFile(file);
    setActiveTab('analyze');
  };

  const handleNavigateToTransform = (imageDataUrl: string, promptHint?: string) => {
    setTransformSourceImage(imageDataUrl);
    setTransformPromptHint(promptHint || null);
    setActiveTab('generate');
  };

  return (
    <ToastProvider>
      <AppShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          // If manually navigating away from analysis without file, clear pending
          if (tab !== 'analyze') {
            setPendingAnalysisFile(null);
          }
        }}
        health={health}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNewSession={handleStartNewSession}
      >
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={(tab) => setActiveTab(tab)}
            onImageSelectedForAnalysis={handleImageSelectedForAnalysis}
            health={health}
          />
        )}

        {activeTab === 'analyze' && (
          <AnalyzeView
            initialFile={pendingAnalysisFile}
            onNavigateToTransform={handleNavigateToTransform}
          />
        )}

        {activeTab === 'generate' && (
          <GenerateView
            initialSourceImage={transformSourceImage}
            initialPromptHint={transformPromptHint}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onNavigate={(tab) => setActiveTab(tab)}
            onRestoreAnalysis={(item) => {
              if (item?.imageDataUrl || item?.outputImageUrl) {
                // Fetch or convert data url to file
                const url = item.imageDataUrl || item.outputImageUrl;
                fetch(url)
                  .then((r) => r.blob())
                  .then((blob) => {
                    const file = new File([blob], item.title || 'restored-image.png', {
                      type: blob.type || 'image/png',
                    });
                    setPendingAnalysisFile(file);
                    setActiveTab('analyze');
                  })
                  .catch(() => setActiveTab('analyze'));
              } else {
                setActiveTab('analyze');
              }
            }}
            onRestoreGeneration={(item) => {
              const url = item?.outputImageUrl || item?.imageDataUrl;
              if (url) {
                setTransformSourceImage(url);
                setTransformPromptHint(item.prompt || null);
              }
              setActiveTab('generate');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            currentTheme={theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            health={health}
          />
        )}

        {/* Global Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={user}
          onUserUpdate={(updated) => setUser(updated)}
        />
      </AppShell>
    </ToastProvider>
  );
}
