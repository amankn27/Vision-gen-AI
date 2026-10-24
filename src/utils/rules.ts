/**
 * VisionGen AI - Pure Business Logic and Validation Utilities
 */

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: { size: number; type: string; name: string }): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Normalize MIME type
  const normalizedType = file.type.toLowerCase();
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  const isMimeValid = SUPPORTED_MIME_TYPES.includes(normalizedType);
  const isExtValid = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '');

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: `Unsupported format (${file.type || fileExt}). VisionGen AI supports JPG, PNG, and WEBP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum supported size is 20 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Selected file is empty (0 bytes).',
    };
  }

  return { valid: true };
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export function truncatePrompt(prompt: string, maxLength: number = 60): string {
  if (!prompt) return 'Untitled Session';
  const clean = prompt.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
}

export interface AspectRatioPreset {
  id: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: '1:1', label: 'Square', ratio: '1:1', width: 1024, height: 1024 },
  { id: '16:9', label: 'Landscape', ratio: '16:9', width: 1344, height: 768 },
  { id: '9:16', label: 'Portrait', ratio: '9:16', width: 768, height: 1344 },
  { id: '4:3', label: 'Standard', ratio: '4:3', width: 1152, height: 864 },
  { id: '3:4', label: 'Document', ratio: '3:4', width: 864, height: 1152 },
];

export function getPresetByRatio(ratioStr: string): AspectRatioPreset {
  return (
    ASPECT_RATIO_PRESETS.find((p) => p.ratio === ratioStr || p.id === ratioStr) ||
    ASPECT_RATIO_PRESETS[0]
  );
}

export interface GenericItem {
  id: string;
  type: 'analysis' | 'generation' | 'transform';
  title?: string;
  prompt?: string;
  createdAt: string;
}

export function filterHistoryItems<T extends GenericItem>(
  items: T[],
  filterType: 'all' | 'analysis' | 'generation' | 'transform',
  searchQuery: string = '',
  sortBy: 'newest' | 'oldest' = 'newest'
): T[] {
  let filtered = [...items];

  if (filterType !== 'all') {
    filtered = filtered.filter((item) => item.type === filterType);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(q);
      const promptMatch = item.prompt?.toLowerCase().includes(q);
      return Boolean(titleMatch || promptMatch);
    });
  }

  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return filtered;
}
