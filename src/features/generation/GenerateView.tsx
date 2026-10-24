import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  Sliders,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Layers,
  HelpCircle,
  AlertCircle,
  Dice5,
  Eye,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ASPECT_RATIO_PRESETS, AspectRatioPreset, getPresetByRatio } from '../../utils/rules';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

interface GenerateViewProps {
  initialSourceImage?: string | null;
  initialPromptHint?: string | null;
}

export const GenerateView: React.FC<GenerateViewProps> = ({
  initialSourceImage,
  initialPromptHint,
}) => {
  const { success, error, info } = useToast();

  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>(
    initialSourceImage ? 'image-to-image' : 'text-to-image'
  );

  const [prompt, setPrompt] = useState<string>(initialPromptHint || '');
  const [sourceImage, setSourceImage] = useState<string | null>(initialSourceImage || null);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [seed, setSeed] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [useCheckerboard, setUseCheckerboard] = useState<boolean>(false);

  // Job states: idle | queued | generating | succeeded | failed
  const [jobState, setJobState] = useState<'idle' | 'generating' | 'succeeded' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentResultUrl, setCurrentResultUrl] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSourceImage) {
      setSourceImage(initialSourceImage);
      setMode('image-to-image');
    }
  }, [initialSourceImage]);

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
        success('Source image loaded for transformation');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || jobState === 'generating') return;
    if (mode === 'image-to-image' && !sourceImage) {
      setErrorMessage('Please provide a source image for transformation mode.');
      return;
    }

    setJobState('generating');
    setStatusMessage('Submitting request to Cloudflare Workers AI...');
    setErrorMessage(null);

    try {
      setStatusMessage('Generating image with FLUX.2 Klein 4B on Cloudflare Workers AI...');
      const parsedSeed = seed.trim() ? parseInt(seed.trim(), 10) : undefined;

      const res = await api.generateImage({
        prompt: prompt.trim(),
        mode,
        sourceImage: sourceImage || undefined,
        aspectRatio,
        negativePrompt: negativePrompt.trim() || undefined,
        seed: isNaN(parsedSeed as number) ? undefined : parsedSeed,
      });

      setCurrentResultUrl(res.imageUrl);
      setGenerationMeta({
        id: res.id,
        prompt: res.prompt,
        settings: res.settings,
        model: res.model,
        createdAt: res.createdAt,
      });

      setJobState('succeeded');
      success('Visual generation completed successfully');
    } catch (err: any) {
      setJobState('failed');
      setErrorMessage(
        err?.message || 'Generation failed. Please refine your prompt or check model limits.'
      );
      error(err?.message || 'Generation failed');
    }
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    success('Prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleDownload = () => {
    if (!currentResultUrl) return;
    const link = document.createElement('a');
    link.href = currentResultUrl;
    link.download = `visiongen-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Image download initiated');
  };

  const handleUseAsSource = () => {
    if (!currentResultUrl) return;
    setSourceImage(currentResultUrl);
    setMode('image-to-image');
    success('Image set as transformation source');
  };

  const promptIdeas = [
    'A tranquil Japanese garden at blue hour with stone lanterns and soft mist, cinematic lighting, 8k resolution',
    'A vintage botanical illustration of exotic succulents with watercolor textures and crisp cursive annotation',
    'Futuristic architecture hovering over an emerald ocean, clean brutalist geometric lines, golden hour sunset',
    'Macro photograph of dew drops resting on iridescent hummingbird feathers, shallow depth of field',
  ];

  const currentPreset = getPresetByRatio(aspectRatio);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-[var(--vg-bg-app)]">
      {/* LEFT: Generation Controls Panel (360px on desktop) */}
      <div className="w-full md:w-96 flex flex-col border-b md:border-b-0 md:border-r border-[var(--vg-border)] bg-[var(--vg-surface-main)] overflow-y-auto shrink-0 p-5 space-y-5">
        {/* Mode Switcher */}
        <div>
          <label className="block text-xs font-semibold text-[var(--vg-text-muted)] uppercase tracking-wider mb-2">
            Creation Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)]">
            <button
              onClick={() => setMode('text-to-image')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'text-to-image'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Text to Image</span>
            </button>
            <button
              onClick={() => setMode('image-to-image')}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'image-to-image'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Transform</span>
            </button>
          </div>
        </div>

        {/* Source Image Selector in Transform Mode */}
        {mode === 'image-to-image' && (
          <div className="p-3.5 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[var(--vg-text-primary)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--vg-accent-cyan)]" />
                <span>Source Image</span>
              </label>
              {sourceImage && (
                <button
                  onClick={() => setSourceImage(null)}
                  className="text-[11px] text-[var(--vg-status-error)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {sourceImage ? (
              <div className="relative rounded-lg overflow-hidden border border-[var(--vg-border)] h-28 bg-black flex items-center justify-center">
                <img
                  src={sourceImage}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-24 rounded-lg border-2 border-dashed border-[var(--vg-border)] hover:border-[var(--vg-accent-primary)] flex flex-col items-center justify-center cursor-pointer transition-colors p-2 text-center"
              >
                <ImageIcon className="w-5 h-5 text-[var(--vg-text-muted)] mb-1" />
                <span className="text-xs font-medium text-[var(--vg-text-primary)]">
                  Upload source image
                </span>
                <span className="text-[10px] text-[var(--vg-text-muted)]">
                  JPG, PNG, WEBP up to 20 MB
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleSourceUpload}
            />
          </div>
        )}

        {/* Prompt Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="gen-prompt"
              className="text-xs font-semibold text-[var(--vg-text-primary)]"
            >
              Creative Prompt
            </label>
            <span className="text-[11px] text-[var(--vg-text-muted)]">
              {prompt.length} chars
            </span>
          </div>

          <textarea
            id="gen-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cinematic aerial view of an ancient temple enveloped in misty morning cloud forests..."
            rows={4}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vg-accent-primary)] resize-none leading-relaxed"
          />

          {/* Quick Prompt Ideas */}
          <div>
            <p className="text-[11px] text-[var(--vg-text-muted)] mb-1.5">Try an inspiration idea:</p>
            <div className="space-y-1">
              {promptIdeas.slice(0, 2).map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(idea)}
                  className="w-full text-left text-[11px] p-2 rounded-lg bg-[var(--vg-surface-elevated)]/60 hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] transition-colors truncate cursor-pointer"
                >
                  "{idea}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--vg-text-primary)]">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {ASPECT_RATIO_PRESETS.map((p) => {
              const isSelected = aspectRatio === p.ratio;
              return (
                <button
                  key={p.id}
                  onClick={() => setAspectRatio(p.ratio)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[var(--vg-accent-primary)] bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)] font-semibold'
                      : 'border-[var(--vg-border)] bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)]'
                  }`}
                >
                  <span className="text-[11px] font-mono">{p.ratio}</span>
                  <span className="text-[9px] text-[var(--vg-text-muted)] mt-0.5">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Settings Accordion */}
        <div className="pt-1">
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] space-y-3 animate-in fade-in">
              <div>
                <label
                  htmlFor="neg-prompt"
                  className="block text-[11px] font-medium text-[var(--vg-text-secondary)] mb-1"
                >
                  Negative Prompt
                </label>
                <input
                  id="neg-prompt"
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="blurry, distorted, oversaturated, low quality"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--vg-accent-primary)]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="gen-seed"
                    className="block text-[11px] font-medium text-[var(--vg-text-secondary)]"
                  >
                    Seed
                  </label>
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 9999999).toString())}
                    className="text-[10px] text-[var(--vg-accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Dice5 className="w-3 h-3" />
                    <span>Randomize</span>
                  </button>
                </div>
                <input
                  id="gen-seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--vg-accent-primary)] font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate Primary CTA Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!prompt.trim() || jobState === 'generating'}
            isLoading={jobState === 'generating'}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            {jobState === 'generating'
              ? 'Generating with Cloudflare Workers AI...'
              : mode === 'image-to-image'
              ? 'Transform Visual'
              : 'Generate Visual'}
          </Button>

          {errorMessage && (
            <div
              role="alert"
              className="mt-3 p-3 rounded-xl bg-[var(--vg-status-error)]/10 border border-[var(--vg-status-error)]/30 text-xs text-[var(--vg-status-error)] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: High-Resolution Result & Preview Canvas */}
      <div className="flex-1 flex flex-col bg-[#0B0D12] overflow-hidden">
        {/* Canvas Top Bar */}
        <div className="h-12 px-5 flex items-center justify-between border-b border-[var(--vg-border)] bg-[var(--vg-surface-main)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--vg-text-primary)]">
              Studio Result
            </span>
            <Badge variant="outline" size="sm">
              {currentPreset.ratio} ({currentPreset.label})
            </Badge>
          </div>

          {currentResultUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCheckerboard((prev) => !prev)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                  useCheckerboard
                    ? 'border-[var(--vg-accent-primary)] bg-[var(--vg-accent-primary)]/15 text-[var(--vg-accent-primary)]'
                    : 'border-[var(--vg-border)] text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'
                }`}
                title="Toggle transparency check pattern"
              >
                <Layers className="w-4 h-4" />
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                leftIcon={copiedPrompt ? <Check className="w-3.5 h-3.5 text-[var(--vg-status-success)]" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedPrompt ? 'Copied' : 'Copy Prompt'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleUseAsSource}
                leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[var(--vg-accent-primary)]" />}
              >
                Use as Source
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download
              </Button>
            </div>
          )}
        </div>

        {/* Viewport Rendering Area */}
        <div
          className={`flex-1 flex items-center justify-center p-6 overflow-auto ${
            useCheckerboard ? 'checkerboard-pattern' : 'bg-[#0B0D12]'
          }`}
        >
          {jobState === 'generating' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-accent-primary)]/40 flex items-center justify-center text-[var(--vg-accent-primary)] shadow-lg animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--vg-text-primary)]">
                  {statusMessage || 'Rendering visual assets...'}
                </p>
                <p className="text-xs text-[var(--vg-text-muted)] mt-1">
                  FLUX.2 Klein 4B on Cloudflare Workers AI is generating your image. Processing time depends on model capacity and your account limits.
                </p>
              </div>
            </div>
          ) : currentResultUrl ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center animate-in zoom-in-95 duration-200">
              <img
                src={currentResultUrl}
                alt="Generated output"
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-[var(--vg-border)]"
              />
            </div>
          ) : (
            <div className="text-center p-8 flex flex-col items-center justify-center space-y-3 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] flex items-center justify-center text-[var(--vg-text-muted)]">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">
                Ready for Generation
              </h3>
              <p className="text-xs text-[var(--vg-text-muted)] leading-relaxed">
                Compose a prompt on the left or select an idea to render with FLUX.2 Klein 4B.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        {generationMeta && (
          <div className="p-3 px-5 border-t border-[var(--vg-border)] bg-[var(--vg-surface-main)] flex items-center justify-between text-xs text-[var(--vg-text-muted)] shrink-0">
            <span className="truncate max-w-md">
              <strong className="text-[var(--vg-text-secondary)]">Prompt:</strong> {generationMeta.prompt}
            </span>
            <span className="font-mono text-[11px] shrink-0">
              Model: {generationMeta.model}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
