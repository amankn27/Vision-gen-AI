import React, { useEffect, useState } from 'react';
import {
  ScanEye,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileSearch,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Dropzone } from '../../components/ui/Dropzone';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { NavigationTab, ServiceHealth } from '../../types';
import { api } from '../../services/api';
import { formatTimestamp, truncatePrompt } from '../../utils/rules';

interface OverviewViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onImageSelectedForAnalysis: (file: File) => void;
  onSelectTransformSource?: (imageUrl: string) => void;
  health: ServiceHealth | null;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onImageSelectedForAnalysis,
  health,
}) => {
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistory(true);
    api
      .getHistory({ type: 'all' })
      .then((res) => {
        if (isMounted) setRecentItems(res.items.slice(0, 6));
      })
      .catch((err) => console.error('Failed to load recent history:', err))
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const actionTiles = [
    {
      id: 'analyze',
      title: 'Analyze Image',
      description: 'Upload an image for deep semantic description, verbatim OCR text extraction, and visual Q&A.',
      icon: ScanEye,
      action: () => onNavigate('analyze'),
      badge: 'HF Vision',
      accentColor: 'text-[var(--vg-accent-primary)]',
      bgGlow: 'hover:border-[var(--vg-accent-primary)]/50',
    },
    {
      id: 'generate',
      title: 'Generate Image',
      description: 'Create high-fidelity visuals from natural language prompts with fine aspect ratio and seed controls.',
      icon: Sparkles,
      action: () => onNavigate('generate'),
      badge: 'HF Image Model',
      accentColor: 'text-amber-400',
      bgGlow: 'hover:border-amber-500/50',
    },
    {
      id: 'transform',
      title: 'Transform Image',
      description: 'Supply an existing source image and direct AI variations, style transfers, and visual adaptations.',
      icon: RefreshCw,
      action: () => onNavigate('generate'),
      badge: 'Image to Image',
      accentColor: 'text-[var(--vg-accent-cyan)]',
      bgGlow: 'hover:border-[var(--vg-accent-cyan)]/50',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-8">
      {/* Studio Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[var(--vg-surface-main)] via-[var(--vg-surface-elevated)] to-[var(--vg-surface-main)] border border-[var(--vg-border)] p-6 sm:p-8 overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="accent" size="sm" icon={<Cpu className="w-3 h-3" />}>
              Multimodal Visual Studio
            </Badge>
            {health && (
              <Badge variant="cyan" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                {health.apiAvailable ? 'HF Token Configured' : 'Configure HF_TOKEN'}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--vg-text-primary)]">
            Your Visual Intelligence Workspace
          </h2>
          <p className="mt-2 text-sm text-[var(--vg-text-secondary)] leading-relaxed">
            Inspect, comprehend, transcribe, and synthesize images with state-of-the-art multimodal AI.
            Fast, accurate, and built for real creative and analytical workflows.
          </p>
        </div>
      </div>

      {/* Primary Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actionTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card
              key={tile.id}
              onClick={tile.action}
              className={`p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group ${tile.bgGlow}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] group-hover:scale-105 transition-transform">
                    <Icon className={`w-5 h-5 ${tile.accentColor}`} />
                  </div>
                  <Badge variant="outline" size="sm">
                    {tile.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-[var(--vg-text-primary)] group-hover:text-[var(--vg-accent-primary)] transition-colors">
                  {tile.title}
                </h3>
                <p className="mt-1.5 text-xs text-[var(--vg-text-secondary)] leading-relaxed">
                  {tile.description}
                </p>
              </div>

              <div className="mt-5 flex items-center text-xs font-medium text-[var(--vg-accent-primary)] group-hover:translate-x-1 transition-transform">
                <span>Open studio</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Image Upload Dropzone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">
              Quick Image Inspection
            </h3>
            <p className="text-xs text-[var(--vg-text-muted)]">
              Drop an image below to immediately start analysis, OCR, or contextual questioning.
            </p>
          </div>
        </div>

        <Dropzone onFileSelect={onImageSelectedForAnalysis} compact={false} />
      </div>

      {/* Real Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--vg-accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Recent Activity</h3>
          </div>
          {recentItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('history')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View all history
            </Button>
          )}
        </div>

        {isLoadingHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] animate-pulse"
              />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] flex items-center justify-center text-[var(--vg-text-muted)]">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--vg-text-primary)]">No recent studio tasks</p>
              <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-sm">
                Your analyzed images, OCR transcripts, and generated assets will be securely saved here.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="primary" onClick={() => onNavigate('analyze')}>
                Analyze an image
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onNavigate('generate')}>
                Generate visual
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentItems.map((item) => {
              const thumbnail = item.outputImageUrl || item.imageDataUrl;
              return (
                <Card
                  key={item.id}
                  onClick={() => onNavigate('history')}
                  interactive
                  className="p-3.5 flex items-center gap-3.5"
                >
                  <div className="w-16 h-16 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] shrink-0 overflow-hidden flex items-center justify-center">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Layers className="w-6 h-6 text-[var(--vg-text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <Badge
                        variant={item.type === 'analysis' ? 'accent' : 'cyan'}
                        size="sm"
                        className="capitalize"
                      >
                        {item.type}
                      </Badge>
                      <span className="text-[10px] text-[var(--vg-text-muted)] shrink-0">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--vg-text-primary)] truncate">
                      {item.title || truncatePrompt(item.prompt, 35)}
                    </p>
                    <p className="text-[11px] text-[var(--vg-text-muted)] truncate mt-0.5">
                      {item.model || 'VisionGen AI'}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
