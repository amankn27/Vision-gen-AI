import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { formatTimestamp, truncatePrompt, filterHistoryItems } from '../../utils/rules';
import { NavigationTab } from '../../types';

interface HistoryViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onRestoreAnalysis?: (item: any) => void;
  onRestoreGeneration?: (item: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onNavigate,
  onRestoreAnalysis,
  onRestoreGeneration,
}) => {
  const { success, error, info } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'analysis' | 'generation' | 'transform'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Inspection Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion Confirmation Dialog State
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.getHistory({ type: filterType, query: searchQuery });
      setItems(res.items);
    } catch (err: any) {
      error(err?.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteHistoryItem(itemToDelete.id);
      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null);
      }
      success('History item deleted');
      setItemToDelete(null);
    } catch (err: any) {
      error(err?.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = filterHistoryItems(items, filterType, searchQuery, sortBy);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--vg-border)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--vg-text-primary)]">
            History Gallery
          </h2>
          <p className="text-xs text-[var(--vg-text-secondary)] mt-0.5">
            Review and reopen your previous analyses, OCR scans, and image generations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--vg-accent-primary)]"
            />
            <Search className="w-3.5 h-3.5 text-[var(--vg-text-muted)] absolute left-3 top-2.5" />
          </div>

          <button
            onClick={() => setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
            className="p-2 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-xs text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] cursor-pointer flex items-center gap-1.5"
            title={`Sort: ${sortBy === 'newest' ? 'Newest first' : 'Oldest first'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline capitalize">{sortBy}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Records' },
          { id: 'analysis', label: 'Image Analyses' },
          { id: 'generation', label: 'Generations' },
          { id: 'transform', label: 'Transformations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              filterType === tab.id
                ? 'bg-[var(--vg-accent-primary)] text-white shadow-xs'
                : 'bg-[var(--vg-surface-elevated)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] border border-[var(--vg-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] flex items-center justify-center text-[var(--vg-text-muted)]">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[var(--vg-text-primary)]">No history records found</p>
          <p className="text-xs text-[var(--vg-text-muted)] max-w-sm">
            {searchQuery
              ? `No records matching "${searchQuery}". Try clearing your search query.`
              : 'Tasks created in the studio will automatically appear here.'}
          </p>
          <div className="pt-2 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => onNavigate('analyze')}>
              New Image Analysis
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onNavigate('generate')}>
              Generate Visual
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const thumbnail = item.outputImageUrl || item.imageDataUrl;
            return (
              <Card
                key={item.id}
                className="overflow-hidden flex flex-col justify-between group hover:border-[var(--vg-accent-primary)]/40 transition-all"
              >
                {/* Image Box */}
                <div
                  onClick={() => setSelectedItem(item)}
                  className="relative h-44 bg-black overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-opacity"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="History visual"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <Layers className="w-8 h-8 text-[var(--vg-text-muted)]" />
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <Badge
                      variant={item.type === 'analysis' ? 'accent' : 'cyan'}
                      size="sm"
                      className="capitalize backdrop-blur-md"
                    >
                      {item.type}
                    </Badge>
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--vg-text-primary)] line-clamp-1 mb-1">
                      {item.title || item.prompt || 'Studio Session'}
                    </h3>
                    <p className="text-[11px] text-[var(--vg-text-secondary)] line-clamp-2 leading-relaxed">
                      {item.currentResult || item.ocrText || item.prompt || 'No additional summary'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--vg-border)] flex items-center justify-between">
                    <span className="text-[10px] text-[var(--vg-text-muted)] font-mono">
                      {formatTimestamp(item.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-[var(--vg-surface-hover)] cursor-pointer"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg text-[var(--vg-text-muted)] hover:text-[var(--vg-status-error)] hover:bg-[var(--vg-status-error)]/10 cursor-pointer"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Item Detail Inspection Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title || selectedItem.prompt || 'Studio Task Detail'}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Visual Preview */}
            <div className="h-64 rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[var(--vg-border)]">
              <img
                src={selectedItem.outputImageUrl || selectedItem.imageDataUrl}
                alt="Selected visual"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Structured details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--vg-border)]">
                <span className="text-[var(--vg-text-muted)]">Type:</span>
                <Badge variant="accent" size="sm" className="capitalize">
                  {selectedItem.type}
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[var(--vg-border)]">
                <span className="text-[var(--vg-text-muted)]">Model:</span>
                <span className="font-mono text-[var(--vg-text-primary)]">
                  {selectedItem.model || 'VisionGen AI'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[var(--vg-border)]">
                <span className="text-[var(--vg-text-muted)]">Timestamp:</span>
                <span className="text-[var(--vg-text-secondary)]">
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </span>
              </div>

              {selectedItem.prompt && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--vg-text-primary)]">Prompt:</span>
                    <button
                      onClick={() => handleCopy(selectedItem.prompt, 'prompt')}
                      className="text-[11px] text-[var(--vg-accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'prompt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'prompt' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="p-2.5 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-secondary)] leading-relaxed">
                    {selectedItem.prompt}
                  </p>
                </div>
              )}

              {selectedItem.ocrText && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--vg-text-primary)]">OCR Transcription:</span>
                    <button
                      onClick={() => handleCopy(selectedItem.ocrText, 'ocr')}
                      className="text-[11px] text-[var(--vg-accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'ocr' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'ocr' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] font-mono text-[var(--vg-text-primary)] whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {selectedItem.ocrText}
                  </pre>
                </div>
              )}

              {selectedItem.currentResult && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[var(--vg-text-primary)]">Analysis Text:</span>
                    <button
                      onClick={() => handleCopy(selectedItem.currentResult, 'analysis')}
                      className="text-[11px] text-[var(--vg-accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'analysis' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'analysis' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="p-2.5 rounded-lg bg-[var(--vg-surface-elevated)] border border-[var(--vg-border)] text-[var(--vg-text-secondary)] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {selectedItem.currentResult}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--vg-border)]">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Eye className="w-3.5 h-3.5 text-[var(--vg-accent-primary)]" />}
                  onClick={() => {
                    if (onRestoreAnalysis) {
                      onRestoreAnalysis(selectedItem);
                    }
                    onNavigate('analyze');
                    setSelectedItem(null);
                  }}
                >
                  Open in Analyze
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--vg-accent-cyan)]" />}
                  onClick={() => {
                    if (onRestoreGeneration) {
                      onRestoreGeneration(selectedItem);
                    }
                    onNavigate('generate');
                    setSelectedItem(null);
                  }}
                >
                  Use in Transform
                </Button>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete History Record"
        message={`Are you sure you want to delete "${truncatePrompt(
          itemToDelete?.title || itemToDelete?.prompt,
          30
        )}"? This action cannot be undone.`}
        confirmLabel="Delete Record"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
