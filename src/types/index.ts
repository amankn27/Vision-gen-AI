export type NavigationTab = 'overview' | 'analyze' | 'generate' | 'history' | 'settings';

export type ThemeMode = 'dark' | 'light' | 'system';

export type TaskType = 'analysis' | 'generation' | 'transform';

export type AnalysisAction = 'describe' | 'ocr' | 'objects' | 'summarize' | 'detailed';

export type JobStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'offline';
  models: {
    vision: string;
    generation: string;
    transformation?: string;
  };
  apiAvailable: boolean;
  maxUploadMb: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionType?: AnalysisAction;
}

export interface AnalysisSession {
  id: string;
  type: 'analysis';
  title: string;
  imageDataUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  currentResult?: string;
  ocrText?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationSettings {
  aspectRatio: string; // '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  negativePrompt?: string;
  seed?: number;
  quality?: 'standard' | 'high';
  strength?: number; // for transform mode
}

export interface GenerationItem {
  id: string;
  type: 'generation' | 'transform';
  prompt: string;
  mode: 'text-to-image' | 'image-to-image';
  sourceImage?: string; // data url if transform
  outputImageUrl: string;
  settings: GenerationSettings;
  model: string;
  createdAt: string;
}

export interface UserSettings {
  theme: ThemeMode;
  defaultAspectRatio: string;
  autoSaveHistory: boolean;
  retentionDays: number;
}
