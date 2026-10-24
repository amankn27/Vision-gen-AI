import {
  ServiceHealth,
  UserProfile,
  AnalysisAction,
  UserSettings,
} from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function resizeReferenceImage(dataUrl: string, maxDimension = 511): Promise<string> {
  // Cloudflare FLUX.2 Klein expects each reference image to be smaller than 512x512.
  // Resize inside the browser so the backend does not need an image-processing dependency.
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not read the reference image. Please upload it again.'));
    image.src = dataUrl;
  });

  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (!longestSide) throw new Error('The reference image has invalid dimensions.');
  if (longestSide <= maxDimension) return dataUrl;

  const scale = maxDimension / longestSide;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the reference image for Cloudflare.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      }
    } catch {
      // ignore
    }
    throw new ApiError(response.status, errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async getHealth(): Promise<ServiceHealth> {
    return request<ServiceHealth>('/api/health');
  },

  async getCurrentUser(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/me');
  },

  async login(email: string, name?: string): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  async logout(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  async analyzeImage(params: {
    image: string;
    action: AnalysisAction;
    prompt?: string;
  }): Promise<{
    id: string;
    text: string;
    ocrText?: string;
    action: AnalysisAction;
    metadata: { model: string; processingTimeMs: number };
  }> {
    return request('/api/vision/analyze', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async askVisualQuestion(params: {
    image: string;
    question: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ reply: string; model: string; timestamp: string }> {
    return request('/api/vision/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateImage(params: {
    prompt: string;
    mode?: 'text-to-image' | 'image-to-image';
    sourceImage?: string;
    aspectRatio?: string;
    negativePrompt?: string;
    seed?: number;
  }): Promise<{
    id: string;
    imageUrl: string;
    prompt: string;
    settings: any;
    model: string;
    createdAt: string;
  }> {
    const adjustedParams = params.mode === 'image-to-image' && params.sourceImage
      ? { ...params, sourceImage: await resizeReferenceImage(params.sourceImage) }
      : params;
    return request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(adjustedParams),
    });
  },

  async getHistory(params?: {
    type?: string;
    query?: string;
  }): Promise<{ items: any[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.type && params.type !== 'all') searchParams.set('type', params.type);
    if (params?.query) searchParams.set('query', params.query);
    const queryStr = searchParams.toString();
    return request<{ items: any[]; total: number }>(`/api/history${queryStr ? '?' + queryStr : ''}`);
  },

  async deleteHistoryItem(id: string): Promise<{ success: boolean; id: string }> {
    return request<{ success: boolean; id: string }>(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  async getSettings(): Promise<{ settings: UserSettings }> {
    return request<{ settings: UserSettings }>('/api/settings');
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<{ success: boolean; settings: UserSettings }> {
    return request<{ success: boolean; settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
