import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Cpu,
  ShieldCheck,
  HardDrive,
  Trash2,
  Check,
  Save,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ServiceHealth, UserSettings, ThemeMode } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { ASPECT_RATIO_PRESETS } from '../../utils/rules';

interface SettingsViewProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  health: ServiceHealth | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  health,
}) => {
  const { success, error } = useToast();

  const [settings, setSettings] = useState<UserSettings>({
    theme: currentTheme,
    defaultAspectRatio: '1:1',
    autoSaveHistory: true,
    retentionDays: 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .getSettings()
      .then((res) => {
        setSettings(res.settings);
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSettings(settings);
      success('Studio preferences saved successfully');
    } catch (err: any) {
      error(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      const res = await api.getHistory({ type: 'all' });
      for (const it of res.items) {
        await api.deleteHistoryItem(it.id);
      }
      setShowClearConfirm(false);
      success('History records cleared');
    } catch (err: any) {
      error('Failed to clear history');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--vg-text-primary)]">
          Studio Settings
        </h2>
        <p className="text-xs text-[var(--vg-text-secondary)] mt-0.5">
          Configure appearance, runtime preferences, and inspect live multimodal models.
        </p>
      </div>

      {/* Appearance Section */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Interface Theme</h3>
          <p className="text-xs text-[var(--vg-text-muted)] mt-0.5">
            Select your preferred visual style. Persistent across sessions.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon },
            { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun },
            { id: 'system' as ThemeMode, label: 'System Default', icon: Laptop },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onThemeChange(t.id);
                  setSettings((prev) => ({ ...prev, theme: t.id }));
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--vg-accent-primary)] bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] font-semibold shadow-xs'
                    : 'border-[var(--vg-border)] bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)]'
                }`}
              >
                <Icon className="w-5 h-5 mb-1.5" />
                <span className="text-xs">{t.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Model & Runtime Manifest */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">
              Model & Runtime Manifest
            </h3>
            <p className="text-xs text-[var(--vg-text-muted)] mt-0.5">
              Vision/OCR/chat run locally through Ollama. Image generation and editing use Cloudflare Workers AI with a limited daily free allocation.
            </p>
          </div>
          <Badge variant={health?.status === 'healthy' ? 'success' : 'warning'} size="sm">
            {health?.status || 'Active'}
          </Badge>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-[var(--vg-accent-primary)]" />
              <div>
                <p className="font-semibold text-[var(--vg-text-primary)]">Local Vision Model (Ollama)</p>
                <p className="text-[11px] text-[var(--vg-text-muted)]">Local image description, OCR, and Visual Q&A</p>
              </div>
            </div>
            <code className="px-2 py-1 rounded bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] font-mono text-[11px]">
              {health?.models.vision || 'Qwen/Qwen3.8-27B'}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <div>
                <p className="font-semibold text-[var(--vg-text-primary)]">Text-to-Image Model</p>
                <p className="text-[11px] text-[var(--vg-text-muted)]">Cloudflare text-to-image generation</p>
              </div>
            </div>
            <code className="px-2 py-1 rounded bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] font-mono text-[11px]">
              {health?.models.generation || '@cf/black-forest-labs/flux-2-klein-4b'}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-[var(--vg-accent-cyan)]" />
              <div>
                <p className="font-semibold text-[var(--vg-text-primary)]">Image-to-Image Model</p>
                <p className="text-[11px] text-[var(--vg-text-muted)]">Reference-image transformation (same Cloudflare model)</p>
              </div>
            </div>
            <code className="px-2 py-1 rounded bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] font-mono text-[11px]">
              {health?.models.transformation || '@cf/black-forest-labs/flux-2-klein-4b'}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-[var(--vg-accent-cyan)]" />
              <div>
                <p className="font-semibold text-[var(--vg-text-primary)]">Maximum Upload Limit</p>
                <p className="text-[11px] text-[var(--vg-text-muted)]">Per individual image payload</p>
              </div>
            </div>
            <span className="font-mono text-[var(--vg-text-primary)]">
              {health?.maxUploadMb || 20} MB
            </span>
          </div>
        </div>
      </Card>

      {/* Generation Defaults */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Generation Defaults</h3>
          <p className="text-xs text-[var(--vg-text-muted)] mt-0.5">
            Default aspect ratio selected when opening the studio.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--vg-text-secondary)] mb-1.5">
              Default Aspect Ratio Preset
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIO_PRESETS.map((p) => {
                const isSelected = settings.defaultAspectRatio === p.ratio;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSettings((prev) => ({ ...prev, defaultAspectRatio: p.ratio }))}
                    className={`py-2 px-1 text-center rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[var(--vg-accent-primary)] bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] font-semibold'
                        : 'border-[var(--vg-border)] bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)]'
                    }`}
                  >
                    {p.ratio}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-[var(--vg-text-primary)]">
                Auto-save Studio History
              </p>
              <p className="text-[11px] text-[var(--vg-text-muted)]">
                Automatically preserve generated assets and OCR analyses to your history
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveHistory}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, autoSaveHistory: e.target.checked }))
              }
              className="w-4 h-4 accent-[var(--vg-accent-primary)] cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Data Management & Actions */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Data Management</h3>
          <p className="text-xs text-[var(--vg-text-muted)] mt-0.5">
            Manage your persistent studio records and reset state.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear All History Records
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllHistory}
        title="Clear All History Records"
        message="Are you sure you want to delete all saved analyses and generated images? This action is permanent."
        confirmLabel="Clear All Records"
        isDestructive
      />
    </div>
  );
};
