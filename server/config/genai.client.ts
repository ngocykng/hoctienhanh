import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1';

interface GenerateWithRetryOptions {
  model?: string;
  contents: any;
  config?: any;
  maxRetries?: number;
  fallbackModels?: string[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust Gemini generation using DIRECT HTTP calls to avoid v1beta issues.
 * This forces the use of API version v1.
 */
export async function generateContentWithRetryAndFallback(options: GenerateWithRetryOptions) {
  const primaryModel = options.model || 'gemini-3.8-flash';
  const fallbackModels = options.fallbackModels || ['gemini-3.7-flash'];

  const modelsToTry = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const url = `${API_BASE_URL}/models/${currentModel}:generateContent?key=${API_KEY}`;

        // Construct payload for Gemini API v1
        const payload = {
          contents: Array.isArray(options.contents)
            ? options.contents
            : [{ role: 'user', parts: [{ text: options.contents }] }],
          systemInstruction: options.config?.systemInstruction
            ? { parts: [{ text: options.config.systemInstruction }] }
            : undefined,
          generationConfig: {
            temperature: options.config?.temperature,
            responseMimeType: options.config?.responseMimeType,
            responseSchema: options.config?.responseSchema,
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            code: errorData.error?.code,
            message: errorData.error?.message || response.statusText,
          };
        }

        const data = await response.json();

        // Extract text from the nested Gemini response structure
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text };

      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const errorCode = error?.status || error?.code || error?.error?.code;

        const is503Overloaded =
          errorCode === 503 ||
          errorMessage.includes('503') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('UNAVAILABLE');

        const isModelUnavailable =
          errorCode === 404 ||
          errorMessage.includes('404') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('no longer available') ||
          errorMessage.includes('NOT_FOUND');

        const isOtherRetryable =
          errorCode === 429 ||
          errorCode === 500 ||
          errorCode === 502 ||
          errorCode === 504 ||
          errorMessage.includes('429') ||
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('timeout');

        if (is503Overloaded || isModelUnavailable) {
          console.warn(`[Gemini API] Model ${currentModel} returned ${errorCode || 'error'} (${isModelUnavailable ? 'Unavailable/Discontinued' : 'High demand'}). Switching to next fallback model...`);
          break;
        }

        if (!isOtherRetryable) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const waitTime = attempt * 400 + Math.random() * 200;
          await delay(waitTime);
        }
      }
    }
  }

  throw lastError || new Error('Tất cả các mô hình Gemini đều đang bận, vui lòng thử lại sau giây lát.');
}
