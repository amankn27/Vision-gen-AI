# VisionGen AI — Local Vision + Cloud Image Generation

VisionGen AI is a React + Express application for image description, OCR, visual Q&A, image generation, image-to-image editing, and task history.

## AI providers

- **Vision analysis / OCR / image chat:** Ollama running locally, default model `qwen2.5vl:3b`. This traffic remains on your own computer and does not need a hosted inference token.
- **Text-to-image / image editing:** Cloudflare Workers AI, default model `@cf/black-forest-labs/flux-2-klein-4b`.
- Cloudflare credentials are read only by the Express backend and are never sent to the browser.

Cloudflare Workers AI publishes a 10,000-Neuron daily free allocation for eligible usage. This is a limited quota, not unlimited image generation. Check the current [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) and [FLUX.2 Klein 4B docs](https://developers.cloudflare.com/ai/models/@cf/black-forest-labs/flux-2-klein-4b/). FLUX.2 Klein uses multipart form data and supports reference-image editing. Reference images must be smaller than 512×512; the frontend resizes them before sending the request.

## Configure `.env`

Copy `.env.example` to `.env` only if you do not already have a `.env` file. Since you may already have credentials configured, add/update these variables in your existing root `.env` rather than overwriting it:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_VISION_MODEL=qwen2.5vl:3b

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_workers_ai_api_token
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-2-klein-4b

PORT=3000
NODE_ENV=development
```

Use a Cloudflare API token with the required Workers AI permissions, not your Global API Key. Do not put the token in any `VITE_*` variable, React component, or Git repository.

## Windows PowerShell setup

1. Confirm Ollama is running and that the vision model is installed:

```powershell
ollama list
ollama run qwen2.5vl:3b "Describe a red apple on a white table."
```

2. In another PowerShell terminal, from the project root:

```powershell
npm install
npm run lint
npm test
npm run dev
```

3. Open `http://localhost:3000` and then check `http://localhost:3000/api/health`. A healthy status means the local Ollama model is present and Cloudflare credentials are configured; it does not by itself prove the Cloudflare token has successfully run an inference.

## Test image generation with PowerShell

With the server running, send a real generation request:

```powershell
$body = @{
  prompt = 'A cinematic photorealistic image of a red fox in a misty forest at sunrise'
  mode = 'text-to-image'
  aspectRatio = '1:1'
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/generate' -Method Post -ContentType 'application/json' -Body $body
$result.model
$result.imageUrl.Substring(0, 40)
```

The response contains `imageUrl` as a data URL, matching the current frontend contract. Do not print or paste API token values into logs, issues, chats, or screenshots.

## API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Ollama model readiness and Cloudflare configuration |
| `/api/auth/me` | GET | Current demo profile |
| `/api/auth/login` | POST | Demo profile update (not production authentication) |
| `/api/auth/logout` | POST | Demo logout response |
| `/api/vision/analyze` | POST | Image description, OCR, observations, summaries, detail (local Ollama) |
| `/api/vision/chat` | POST | Image-grounded follow-up Q&A (local Ollama) |
| `/api/generate` | POST | Text-to-image and reference-image editing (Cloudflare Workers AI) |
| `/api/history` | GET | Session-process history list |
| `/api/history/:id` | DELETE | Remove one history item |
| `/api/settings` | GET / PUT | Studio preferences |

## Known production limitations

History, preferences, and the active user profile are held in server memory and reset when the server restarts. The login modal is a demo profile selector, not secure authentication. Before publishing for multiple real users, add durable database/object storage, real authentication and session isolation, request rate limits, per-user authorization, and robust file-size/type validation. Do not store large image data URLs in a production database; store files in object storage and keep file references/metadata.

## Troubleshooting

- **Ollama cannot be reached:** start Ollama Desktop or `ollama serve`; verify `http://127.0.0.1:11434/api/tags` and `OLLAMA_BASE_URL`.
- **Ollama model missing:** run `ollama pull qwen2.5vl:3b` and verify `ollama list`.
- **Cloudflare 401/403:** verify the Account ID, API token, and Workers AI permissions.
- **Cloudflare 429/quota/billing:** check Workers AI usage and account limits.
- **Cloudflare 404:** verify `CLOUDFLARE_IMAGE_MODEL` exactly matches a currently supported model ID.
- **History disappears:** expected with the current in-memory store; durable persistence is still required.
