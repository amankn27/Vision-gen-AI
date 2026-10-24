import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ScanText,
  Eye,
  ListFilter,
  FileCheck2,
  Send,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  RefreshCw,
  Sparkles,
  Loader2,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Dropzone } from '../../components/ui/Dropzone';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { AnalysisAction, ChatMessage } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { formatBytes } from '../../utils/rules';

interface AnalyzeViewProps {
  initialFile?: File | null;
  onNavigateToTransform?: (imageDataUrl: string, promptHint?: string) => void;
}

export const AnalyzeView: React.FC<AnalyzeViewProps> = ({
  initialFile,
  onNavigateToTransform,
}) => {
  const { success, error, info } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    size: number;
    name: string;
  } | null>(null);

  // Zoom / Viewport controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Active analysis action & state
  const [activeAction, setActiveAction] = useState<AnalysisAction>('describe');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // Q&A Conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle initialFile handed over from Overview dropzone
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  // Read file into Data URL and compute dimensions
  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageDataUrl(url);
      setImageFile(file);

      // Measure dimensions
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          name: file.name,
        });
      };
      img.src = url;

      // Reset state for new image
      setAnalysisResult(null);
      setOcrResult(null);
      setMessages([]);
      setZoomLevel(1);

      // Automatically trigger initial description
      triggerAnalysis('describe', url);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async (action: AnalysisAction, dataUrlOverride?: string) => {
    const targetImage = dataUrlOverride || imageDataUrl;
    if (!targetImage) return;

    setActiveAction(action);
    setIsAnalyzing(true);

    try {
      const res = await api.analyzeImage({
        image: targetImage,
        action,
      });

      setAnalysisResult(res.text);
      if (action === 'ocr') {
        setOcrResult(res.ocrText || 'No text was found in this image.');
      }

      // Add to conversation thread
      const actionLabels: Record<AnalysisAction, string> = {
        describe: 'Comprehensive Description',
        ocr: 'Text Extraction (OCR)',
        objects: 'Visual Observations',
        summarize: 'Concise Summary',
        detailed: 'Detailed Multi-Angle Analysis',
      };

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant',
          content: res.text,
          timestamp: new Date().toISOString(),
          actionType: action,
        },
      ]);

      success(`${actionLabels[action]} completed`);
    } catch (err: any) {
      error(err?.message || `Failed to analyze image with the vision model`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendQuestion = async (customQ?: string) => {
    const q = (customQ || questionInput).trim();
    if (!q || !imageDataUrl || isAnswering) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setIsAnswering(true);

    try {
      const res = await api.askVisualQuestion({
        image: imageDataUrl,
        question: q,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: res.reply,
        timestamp: res.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      error(err?.message || 'Failed to answer visual question');
    } finally {
      setIsAnswering(false);
    }
  };

  // Scroll chat smoothly on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAnswering]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setImageMeta(null);
    setAnalysisResult(null);
    setOcrResult(null);
    setMessages([]);
  };

  const handleCreateImageFromThis = () => {
    if (!imageDataUrl) return;
    if (onNavigateToTransform) {
      onNavigateToTransform(imageDataUrl, analysisResult?.slice(0, 100));
    }
  };

  const suggestedQuestions = [
    'Describe the scene',
    'Read all text in this image',
    'What objects and people are present?',
    'What is the lighting and color atmosphere?',
  ];

  // 1. Before Upload State
  if (!imageDataUrl) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--vg-text-primary)]">
            Analyze Image
          </h2>
          <p className="mt-1 text-sm text-[var(--vg-text-secondary)]">
            Inspect visual content, extract verbatim OCR text, identify key elements, and chat with a local Ollama vision-language model.
          </p>
        </div>

        <Dropzone onFileSelect={handleFileSelected} />

        {/* Quick Sample Image Starter Chips */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--vg-accent-primary)] shrink-0" />
            <span className="text-xs text-[var(--vg-text-secondary)]">
              No image handy? Try a test studio asset:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                // Synthetic sample document with readable typography
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#0F172A';
                  ctx.fillRect(0, 0, 600, 400);
                  ctx.fillStyle = '#8B5CF6';
                  ctx.font = 'bold 24px sans-serif';
                  ctx.fillText('VisionGen AI Studio Report', 40, 60);
                  ctx.fillStyle = '#F4F6FB';
                  ctx.font = '16px monospace';
                  ctx.fillText('STATUS: ENGINE OPERATIONAL', 40, 110);
                  ctx.fillText('MODEL: LOCAL OLLAMA MULTIMODAL VISION', 40, 140);
                  ctx.fillText('LATENCY: 320ms | PRECISION: OCR OPTIMIZED', 40, 170);
                  ctx.fillStyle = '#A1A9B8';
                  ctx.font = '14px sans-serif';
                  ctx.fillText('Optical Character Recognition & Semantic Analysis', 40, 220);
                  ctx.strokeStyle = '#283041';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(30, 250, 540, 110);
                  ctx.fillStyle = '#67E8F9';
                  ctx.fillText('Transcribe this technical blueprint verbatim.', 50, 290);
                }
                canvas.toBlob((blob) => {
                  if (blob) {
                    const file = new File([blob], 'studio-blueprint.png', { type: 'image/png' });
                    handleFileSelected(file);
                  }
                });
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--vg-surface-main)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] cursor-pointer"
            >
              📄 Technical Blueprint (OCR Test)
            </button>
            <button
              onClick={() => {
                const canvas = document.createElement('canvas');
                canvas.width = 600;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // Beautiful geometric sunset landscape
                  const grad = ctx.createLinearGradient(0, 0, 0, 400);
                  grad.addColorStop(0, '#1E1B4B');
                  grad.addColorStop(0.5, '#7C3AED');
                  grad.addColorStop(0.8, '#F59E0B');
                  grad.addColorStop(1, '#B91C1C');
                  ctx.fillStyle = grad;
                  ctx.fillRect(0, 0, 600, 400);

                  // Glowing sun
                  ctx.fillStyle = '#FEF08A';
                  ctx.beginPath();
                  ctx.arc(300, 220, 60, 0, Math.PI * 2);
                  ctx.fill();

                  // Mountains
                  ctx.fillStyle = '#0F172A';
                  ctx.beginPath();
                  ctx.moveTo(0, 400);
                  ctx.lineTo(150, 260);
                  ctx.lineTo(300, 340);
                  ctx.lineTo(460, 220);
                  ctx.lineTo(600, 400);
                  ctx.fill();
                }
                canvas.toBlob((blob) => {
                  if (blob) {
                    const file = new File([blob], 'sunset-landscape.png', { type: 'image/png' });
                    handleFileSelected(file);
                  }
                });
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--vg-surface-main)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] cursor-pointer"
            >
              🌄 Sunset Landscape (Scene Test)
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card className="p-4 bg-[var(--vg-surface-main)]">
            <ScanText className="w-5 h-5 text-[var(--vg-accent-primary)] mb-2" />
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Precision OCR</h3>
            <p className="text-xs text-[var(--vg-text-muted)] mt-1">
              Extract typography, signage, documents, and labels verbatim into selectable text.
            </p>
          </Card>
          <Card className="p-4 bg-[var(--vg-surface-main)]">
            <Eye className="w-5 h-5 text-[var(--vg-accent-cyan)] mb-2" />
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Visual Understanding</h3>
            <p className="text-xs text-[var(--vg-text-muted)] mt-1">
              Comprehend spatial composition, textures, artistic style, subjects, and lighting.
            </p>
          </Card>
          <Card className="p-4 bg-[var(--vg-surface-main)]">
            <MessageSquare className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-[var(--vg-text-primary)]">Visual Q&A</h3>
            <p className="text-xs text-[var(--vg-text-muted)] mt-1">
              Ask deep questions anchored directly in the high-resolution pixels of your image.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // 2. Two-Pane Studio Workspace After Upload
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-[var(--vg-bg-app)]">
      {/* LEFT PANE: Image Canvas & Image Metadata (50%) */}
      <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-[var(--vg-border)] bg-[var(--vg-surface-main)] overflow-hidden shrink-0 h-[45vh] md:h-full">
        {/* Canvas Toolbar */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--vg-border)] bg-[var(--vg-surface-main)] shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-[var(--vg-text-primary)] truncate max-w-[180px]">
              {imageMeta?.name || 'Image'}
            </span>
            {imageMeta && (
              <span className="text-[11px] text-[var(--vg-text-muted)] shrink-0">
                ({imageMeta.width}×{imageMeta.height} px • {formatBytes(imageMeta.size)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-[var(--vg-text-muted)] w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer ml-1"
              title="Reset Zoom"
              aria-label="Reset zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Replace image hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer ml-2"
              title="Replace image"
              aria-label="Replace image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearImage}
              className="p-1.5 rounded-lg text-[var(--vg-status-error)] hover:bg-[var(--vg-status-error)]/15 cursor-pointer"
              title="Remove image"
              aria-label="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#0B0D12] relative checkerboard-pattern">
          <img
            src={imageDataUrl}
            alt="Uploaded inspect source"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 120ms ease-out',
            }}
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg select-none"
          />
        </div>

        {/* Action strip to transform this image */}
        <div className="p-3 border-t border-[var(--vg-border)] bg-[var(--vg-surface-main)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              Source Ready
            </Badge>
            <span className="text-xs text-[var(--vg-text-muted)] hidden sm:inline">
              Ready for synthesis or transformation
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCreateImageFromThis}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--vg-accent-primary)]" />}
          >
            Create image from this
          </Button>
        </div>
      </div>

      {/* RIGHT PANE: Analysis Toolbar, Results & Visual Q&A (50%) */}
      <div className="w-full md:w-1/2 flex flex-col h-[55vh] md:h-full bg-[var(--vg-bg-app)] overflow-hidden">
        {/* Analysis Action Mode Selector */}
        <div className="p-3 border-b border-[var(--vg-border)] bg-[var(--vg-surface-main)] shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => triggerAnalysis('describe')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeAction === 'describe'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Describe</span>
            </button>

            <button
              onClick={() => triggerAnalysis('ocr')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeAction === 'ocr'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]'
              }`}
            >
              <ScanText className="w-3.5 h-3.5" />
              <span>Extract Text (OCR)</span>
            </button>

            <button
              onClick={() => triggerAnalysis('objects')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeAction === 'objects'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Visual Breakdown</span>
            </button>

            <button
              onClick={() => triggerAnalysis('summarize')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeAction === 'summarize'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Summarize</span>
            </button>

            <button
              onClick={() => triggerAnalysis('detailed')}
              disabled={isAnalyzing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeAction === 'detailed'
                  ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                  : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] border border-[var(--vg-border)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Deep Analysis</span>
            </button>
          </div>
        </div>

        {/* Dedicated OCR Result Panel if OCR action is selected */}
        {activeAction === 'ocr' && ocrResult && (
          <div className="p-4 border-b border-[var(--vg-border)] bg-[var(--vg-surface-elevated)] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ScanText className="w-4 h-4 text-[var(--vg-accent-primary)]" />
                <h4 className="text-xs font-semibold text-[var(--vg-text-primary)] uppercase tracking-wider">
                  OCR Text Extraction Result
                </h4>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={copiedId === 'ocr' ? <Check className="w-3.5 h-3.5 text-[var(--vg-status-success)]" /> : <Copy className="w-3.5 h-3.5" />}
                onClick={() => handleCopyText(ocrResult, 'ocr')}
              >
                {copiedId === 'ocr' ? 'Copied' : 'Copy Text'}
              </Button>
            </div>
            <pre className="p-3 rounded-lg bg-[var(--vg-bg-app)] border border-[var(--vg-border)] text-xs font-mono text-[var(--vg-text-primary)] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed select-text">
              {ocrResult}
            </pre>
          </div>
        )}

        {/* Conversation Stream & Chat History */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Analysis in-progress state banner */}
          {isAnalyzing && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-accent-primary)]/30 text-xs text-[var(--vg-accent-primary)] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Analyzing image with the local Ollama vision model...</span>
            </div>
          )}

          {/* Messages list */}
          {messages.length === 0 && !isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] flex items-center justify-center text-[var(--vg-accent-primary)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--vg-text-primary)]">Visual Conversation</p>
                <p className="text-xs text-[var(--vg-text-muted)] mt-1 max-w-xs">
                  Ask any question about this image, or choose from suggested inquiries below.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] shadow-xs'
                        : 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                    }`}
                  >
                    {isAssistant && msg.actionType && (
                      <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-[var(--vg-border)]">
                        <Badge variant="accent" size="sm" className="capitalize">
                          {msg.actionType}
                        </Badge>
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[var(--vg-status-success)]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap select-text font-normal">
                      {msg.content}
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--vg-text-muted)] mt-1 px-1">
                    {isAssistant ? 'Vision AI' : 'You'}
                  </span>
                </div>
              );
            })
          )}

          {/* Answering indicator */}
          {isAnswering && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--vg-surface-main)] border border-[var(--vg-border)] text-xs text-[var(--vg-text-muted)] w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--vg-accent-primary)]" />
              <span>Formulating visual response...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length < 5 && (
          <div className="px-4 py-2 border-t border-[var(--vg-border)] bg-[var(--vg-surface-main)]/50 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[11px] text-[var(--vg-text-muted)] mr-1">Suggestions:</span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuestion(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:border-[var(--vg-accent-primary)] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Chat Composer */}
        <div className="p-3 border-t border-[var(--vg-border)] bg-[var(--vg-surface-main)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
                placeholder="Ask anything about this image (Enter to send, Shift+Enter for new line)..."
                rows={1}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--vg-accent-primary)] resize-none max-h-28"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!questionInput.trim() || isAnswering}
              isLoading={isAnswering}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
