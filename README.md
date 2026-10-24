# Vision-gen-AI
VisionGen AI is a full-stack AI-powered visual intelligence and image generation platform that combines computer vision, OCR, visual analysis, text-to-image generation, and image transformation into a single web application.

The platform allows users to upload images and perform multiple AI-powered operations, including image description, OCR/text extraction, object and visual analysis, summarization, and detailed visual understanding. It also supports AI image generation and image-to-image transformation from natural-language prompts.

The application uses a React + TypeScript frontend with an Express/Node.js backend. Local vision processing is handled through Ollama with a vision-language model, while image generation and transformation are integrated with Cloudflare Workers AI. The platform also includes user profiles, session history, configurable settings, health/readiness monitoring, theme support, responsive navigation, and cross-workflow image handoff between analysis and generation.

VisionGen AI is designed as an extensible AI engineering application rather than a simple image-generation demo, with a provider-based architecture that can support local and cloud AI inference while keeping API credentials on the server side.
