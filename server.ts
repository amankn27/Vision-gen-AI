import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory history store (resets when this server process restarts)
interface StoredHistoryItem {
  id: string;
  type: 'analysis' | 'generation' | 'transform';
  title?: string;
  prompt?: string;
  imageDataUrl?: string;
  outputImageUrl?: string;
  sourceImage?: string;
  settings?: any;
  ocrText?: string;
  currentResult?: string;
  messages?: any[];
  model?: string;
  createdAt: string;
  updatedAt: string;
}

let historyStore: StoredHistoryItem[] = [];

let userSettings = {
  theme: 'dark',
  defaultAspectRatio: '1:1',
  autoSaveHistory: true,
  retentionDays: 30,
};

let currentUser = {
  id: 'usr_vision_01',
  name: 'Studio Creator',
  email: 'creator@visiongen.ai',
  avatarUrl: '',
  createdAt: new Date().toISOString(),
};

// Local vision/OCR/VQA through Ollama. No hosted vision token is required.
const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '');
const visionModel = (process.env.OLLAMA_VISION_MODEL || 'qwen2.5vl:3b').trim();

// Cloudflare Workers AI for text-to-image and image-to-image generation.
// Keep credentials server-side; never put secrets into VITE_* frontend variables.
const cloudflareAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const cloudflareApiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const cloudflareImageModel = (
  process.env.CLOUDFLARE_IMAGE_MODEL ||
  process.env.IMAGE_MODEL ||
  '@cf/black-forest-labs/flux-2-klein-4b'
).trim();
const cloudflareConfigured = Boolean(cloudflareAccountId && cloudflareApiToken);

// Helpers
function extractBase64(dataUrl: string): { mimeType: string; data: string } {
  const matches = typeof dataUrl === 'string'
    ? dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i)
    : null;
  if (!matches || matches.length < 3) {
    throw new Error('Invalid image data. Please upload a PNG, JPEG, WebP, GIF, or other supported image file.');
  }
  return { mimeType: matches[1], data: matches[2] };
}

function imageBlobFromDataUrl(dataUrl: string): Blob {
  const { mimeType, data } = extractBase64(dataUrl);
  return new Blob([Buffer.from(data, 'base64')], { type: mimeType });
}

type OllamaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
};

async function callOllamaChat(messages: OllamaMessage[], maxTokens = 1200): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: visionModel,
        messages,
        stream: false,
        options: { num_predict: maxTokens, num_ctx: 4096 },
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error || 'Unknown Ollama connection error');
    if (/fetch failed|ECONNREFUSED|ENOTFOUND|timeout|aborted/i.test(message)) {
      throw new Error(`Cannot reach Ollama at ${ollamaBaseUrl}. Start Ollama and confirm that ${visionModel} is installed with "ollama list".`);
    }
    throw new Error(`Ollama request failed: ${message}`);
  }

  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { error: raw }; }
  if (!response.ok) {
    const detail = String(payload?.error || payload?.message || raw || '').replace(/[\\r\\n]+/g, ' ').slice(0, 300);
    if (response.status === 404 || /model.*not found|pull model/i.test(detail)) {
      throw new Error(`Ollama model "${visionModel}" was not found. Run: ollama pull ${visionModel}`);
    }
    throw new Error(`Ollama returned HTTP ${response.status}.${detail ? ` Detail: ${detail}` : ''}`);
  }

  const content = payload?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ollama returned an empty response. Try a shorter prompt or check the backend terminal.');
  }
  return content.trim();
}

async function checkOllamaReady(): Promise<boolean> {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return false;
    const payload: any = await response.json();
    const modelNames = Array.isArray(payload?.models)
      ? payload.models.map((model: any) => String(model?.name || model?.model || ''))
      : [];
    return modelNames.includes(visionModel);
  } catch {
    return false;
  }
}

function describeCloudflareError(status: number, body: string): string {
  const detail = body.replace(/[\r\n]+/g, ' ').slice(0, 350);
  if (status === 401 || status === 403) {
    return 'Cloudflare rejected the API token or permission. Verify CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and the Workers AI Read/Edit permissions.';
  }
  if (status === 402 || status === 429 || /quota|rate.?limit|billing|neurons/i.test(detail)) {
    return 'Cloudflare Workers AI quota or rate limit was reached. Check Workers AI usage and billing; free usage is limited, not unlimited.';
  }
  if (status === 404) {
    return `Cloudflare could not find this model or endpoint. Verify CLOUDFLARE_IMAGE_MODEL. Provider detail: ${detail || 'No detail returned.'}`;
  }
  return `Cloudflare Workers AI image generation failed (HTTP ${status}).${detail ? ` Provider detail: ${detail}` : ''}`;
}

async function runCloudflareImage(input: {
  prompt: string;
  width: number;
  height: number;
  seed?: number;
  sourceImage?: string;
}): Promise<{ bytes: Buffer; mimeType: string }> {
  if (!cloudflareConfigured) {
    throw new Error('Cloudflare image generation is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in the project-root .env, then restart the server.');
  }

  const form = new FormData();
  form.append('prompt', input.prompt);
  form.append('width', String(input.width));
  form.append('height', String(input.height));
  if (input.seed !== undefined) form.append('seed', String(input.seed));

  if (input.sourceImage) {
    // FLUX.2 Klein accepts reference inputs smaller than 512x512. The frontend
    // downsizes source images before sending them to this route.
    const sourceBlob = imageBlobFromDataUrl(input.sourceImage);
    form.append('input_image_0', sourceBlob, 'reference-image');
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cloudflareAccountId)}/ai/run/${cloudflareImageModel}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cloudflareApiToken}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    let detail = responseBody;
    try {
      const parsed = JSON.parse(responseBody);
      if (Array.isArray(parsed?.errors)) {
        detail = parsed.errors.map((item: any) => item?.message || item?.code || '').filter(Boolean).join('; ');
      } else {
        detail = parsed?.error || parsed?.message || parsed?.result?.error || responseBody;
      }
    } catch {
      // The provider may return plain text instead of JSON.
    }
    console.error('[Cloudflare Workers AI] image request failed', { status: response.status, detail: String(detail).slice(0, 350) });
    throw new Error(describeCloudflareError(response.status, String(detail || '')));
  }

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType.startsWith('image/')) {
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error('Cloudflare returned an empty image. Try a different prompt.');
    return { bytes, mimeType: contentType };
  }

  // Cloudflare model responses can be JSON-wrapped Base64, depending on the
  // model/API response format. Support both { result: { image } } and { result }.
  const responseText = await response.text();
  let payload: any;
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = { result: responseText };
  }

  let imageValue: unknown = payload?.result?.image ?? payload?.result?.output_image ?? payload?.image ?? payload?.result;
  if (typeof imageValue !== 'string' || !imageValue.trim()) {
    throw new Error('Cloudflare returned a successful response but no image data was found. Check the model response in the backend terminal.');
  }

  let mimeType = 'image/png';
  const dataUri = imageValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i);
  if (dataUri) {
    mimeType = dataUri[1].toLowerCase();
    imageValue = dataUri[2];
  }
  const bytes = Buffer.from(imageValue.replace(/\s/g, ''), 'base64');
  if (!bytes.length) throw new Error('Cloudflare returned invalid or empty Base64 image data.');
  return { bytes, mimeType };
}

// 1. Health & Readiness API
app.get('/api/health', async (_req: Request, res: Response) => {
  const visionReady = await checkOllamaReady();
  const generationReady = cloudflareConfigured;
  const hasAnyProvider = visionReady || generationReady;
  const allReady = visionReady && generationReady;
  res.json({
    status: allReady ? 'healthy' : hasAnyProvider ? 'degraded' : 'offline',
    apiAvailable: hasAnyProvider,
    provider: 'Local Ollama (vision) + Cloudflare Workers AI (image generation)',
    providers: {
      vision: visionReady ? 'Ollama ready' : 'Ollama/model unavailable',
      generation: generationReady ? 'Cloudflare Workers AI configured' : 'Cloudflare not configured',
    },
    models: {
      vision: visionModel,
      generation: cloudflareImageModel,
      transformation: cloudflareImageModel,
    },
    maxUploadMb: 20,
    timestamp: new Date().toISOString(),
  });
});

// 2. Auth APIs
app.get('/api/auth/me', (_req: Request, res: Response) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  currentUser = {
    ...currentUser,
    email,
    name: name || email.split('@')[0],
  };
  res.json({ user: currentUser });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// 3. Vision Analysis API (Describe, OCR, visual breakdown, summarize, detailed)
app.post('/api/vision/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { image, action = 'describe', prompt: customPrompt } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data URL is required' });
  }

  try {
    const imageParts = extractBase64(image);
    let promptText = '';

    switch (action) {
      case 'ocr':
        promptText = 'Perform optical character recognition (OCR) on this image. Transcribe all visible text verbatim, preserving line breaks and layout where possible. If there is no text, output exactly "[NO_TEXT_DETECTED]". Do not add commentary.';
        break;
      case 'objects':
        promptText = 'Provide a structured inventory of the main visible objects, people, subjects, and environmental elements. Explain their spatial arrangement and visible characteristics. Do not guess details that cannot be seen.';
        break;
      case 'summarize':
        promptText = 'Write a concise 2–3 sentence summary of what this image depicts, including the main subject and setting. Only describe what is visually supported.';
        break;
      case 'detailed':
        promptText = 'Analyze this image in sections: 1) subject and action, 2) composition and framing, 3) colors and lighting, 4) environment and mood, 5) notable textures or readable text. Clearly distinguish observations from uncertain interpretations.';
        break;
      case 'describe':
      default:
        promptText = typeof customPrompt === 'string' && customPrompt.trim()
          ? customPrompt.trim()
          : 'Describe this image clearly, covering the main subject, setting, style, composition, lighting, and notable visual details.';
    }

    const outputText = await callOllamaChat([
      {
        role: 'system',
        content: 'You are VisionGen AI, a careful multimodal visual analysis assistant. Ground answers in visible evidence. Never claim to read text or identify details that are not actually visible.',
      },
      {
        role: 'user',
        content: promptText,
        images: [imageParts.data],
      },
    ], action === 'ocr' ? 2048 : 1400);

    const isOcr = action === 'ocr';
    const hasNoText = isOcr && outputText.includes('[NO_TEXT_DETECTED]');
    const ocrResult = hasNoText ? '' : (isOcr ? outputText : undefined);
    const modelName = visionModel;
    const record: StoredHistoryItem = {
      id: 'analysis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: 'analysis',
      title: customPrompt ? `Q&A: ${String(customPrompt).slice(0, 40)}` : `Analysis (${String(action).toUpperCase()})`,
      imageDataUrl: image,
      currentResult: outputText,
      ocrText: ocrResult,
      model: modelName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (userSettings.autoSaveHistory) {
      historyStore.unshift(record);
      if (historyStore.length > 50) historyStore.pop();
    }

    return res.json({
      id: record.id,
      text: outputText,
      ocrText: ocrResult,
      action,
      metadata: { model: modelName, processingTimeMs: Date.now() - startTime },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected local vision-analysis error.';
    console.error('[Ollama vision analysis] request failed:', message);
    return res.status(/Cannot reach Ollama|model .* was not found/i.test(message) ? 503 : 502).json({ error: message });
  }
});

// 4. Vision Q&A Chat API
app.post('/api/vision/chat', async (req: Request, res: Response) => {
  const { image, question, history = [] } = req.body;

  if (!image || !question) {
    return res.status(400).json({ error: 'Image and question are required' });
  }

  try {
    const imageParts = extractBase64(image);
    const messages: OllamaMessage[] = [
      {
        role: 'system',
        content: 'You are VisionGen AI Visual Assistant. Answer questions about the supplied image accurately and concisely. Use only visible evidence and state uncertainty when appropriate.',
      },
      {
        role: 'user',
        content: 'Use this image as the visual context for the following conversation.',
        images: [imageParts.data],
      },
    ];

    if (Array.isArray(history)) {
      for (const turn of history.slice(-12)) {
        if ((turn?.role === 'user' || turn?.role === 'assistant') && typeof turn?.content === 'string' && turn.content.trim()) {
          messages.push({ role: turn.role, content: turn.content.slice(0, 6000) });
        }
      }
    }
    messages.push({ role: 'user', content: String(question).slice(0, 6000) });

    const reply = await callOllamaChat(messages, 1000);
    return res.json({ reply, model: visionModel, timestamp: new Date().toISOString() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected local vision-chat error.';
    console.error('[Ollama vision chat] request failed:', message);
    return res.status(/Cannot reach Ollama|model .* was not found/i.test(message) ? 503 : 502).json({ error: message });
  }
});

// 5. Image Generation & Transformation API
app.post('/api/generate', async (req: Request, res: Response) => {
  const {
    prompt,
    mode = 'text-to-image',
    sourceImage,
    aspectRatio = '1:1',
    negativePrompt,
    seed,
  } = req.body;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  if (mode === 'image-to-image' && typeof sourceImage !== 'string') {
    return res.status(400).json({ error: 'A source image is required for image-to-image transformation.' });
  }
  if (!cloudflareConfigured) {
    return res.status(503).json({ error: 'Cloudflare image generation is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to .env, then restart the server.' });
  }

  try {
    const allowedRatios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
    };
    const size = allowedRatios[aspectRatio] || allowedRatios['1:1'];
    const parsedSeed = Number(seed);
    const validSeed = seed !== undefined && seed !== null && seed !== '' && Number.isInteger(parsedSeed) && parsedSeed >= 0
      ? parsedSeed
      : undefined;
    const cleanNegativePrompt = typeof negativePrompt === 'string' ? negativePrompt.trim().slice(0, 1000) : '';
    // FLUX.2 Klein does not expose a separate negative_prompt input. Express it as
    // an instruction in the prompt rather than silently ignoring the UI field.
    const finalPrompt = cleanNegativePrompt
      ? `${prompt.trim()}\nAvoid including the following: ${cleanNegativePrompt}`
      : prompt.trim();

    const generatedImage = await runCloudflareImage({
      prompt: finalPrompt,
      width: size.width,
      height: size.height,
      seed: validSeed,
      sourceImage: mode === 'image-to-image' ? sourceImage : undefined,
    });

    const finalImageUrl = `data:${generatedImage.mimeType};base64,${generatedImage.bytes.toString('base64')}`;
    const createdAt = new Date().toISOString();
    const record: StoredHistoryItem = {
      id: (mode === 'image-to-image' ? 'transform_' : 'gen_') + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      type: mode === 'image-to-image' ? 'transform' : 'generation',
      prompt: prompt.trim(),
      outputImageUrl: finalImageUrl,
      sourceImage: sourceImage || undefined,
      settings: { aspectRatio, negativePrompt: cleanNegativePrompt || undefined, seed: validSeed },
      model: cloudflareImageModel,
      createdAt,
      updatedAt: createdAt,
    };

    if (userSettings.autoSaveHistory) {
      historyStore.unshift(record);
      if (historyStore.length > 50) historyStore.pop();
    }

    return res.json({
      id: record.id,
      imageUrl: finalImageUrl,
      prompt: record.prompt,
      settings: record.settings,
      model: cloudflareImageModel,
      createdAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected Cloudflare image generation error.';
    console.error('[Cloudflare Workers AI] image generation error:', message);
    if (/timed out|timeout|aborterror|aborted/i.test(message)) {
      return res.status(504).json({ error: 'Cloudflare image generation timed out. Please try again with a shorter prompt.' });
    }
    return res.status(502).json({ error: message || 'Failed to generate image through Cloudflare Workers AI.' });
  }
});

// 6. History APIs
app.get('/api/history', (req: Request, res: Response) => {
  const { type = 'all', query = '' } = req.query;

  let items = [...historyStore];

  if (type !== 'all') {
    items = items.filter((item) => item.type === type);
  }

  if (typeof query === 'string' && query.trim()) {
    const q = query.toLowerCase().trim();
    items = items.filter((item) => {
      const matchesTitle = item.title?.toLowerCase().includes(q);
      const matchesPrompt = item.prompt?.toLowerCase().includes(q);
      return Boolean(matchesTitle || matchesPrompt);
    });
  }

  res.json({
    items,
    total: items.length,
  });
});

app.delete('/api/history/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = historyStore.length;
  historyStore = historyStore.filter((item) => item.id !== id);

  if (historyStore.length === initialLen) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json({ success: true, id });
});

// 7. Settings APIs
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json({ settings: userSettings });
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updates = req.body;
  userSettings = {
    ...userSettings,
    ...updates,
  };
  res.json({ success: true, settings: userSettings });
});

// In development, hook Vite middleware; in production, serve built dist files
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VisionGen AI server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
