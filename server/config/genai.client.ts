import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface GenerateWithRetryOptions {
  model?: string;
  contents: any;
  config?: any;
  maxRetries?: number;
  fallbackModels?: string[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust Gemini generation with immediate model fallback on 503 (High Demand)
 * and exponential backoff retry for transient network issues.
 */
export async function generateContentWithRetryAndFallback(options: GenerateWithRetryOptions) {
  // Use gemini-2.5-flash as default for optimal speed and reliability, with gemini-3.7-flash and gemini-3.1-flash-lite as fallbacks
  const primaryModel = options.model || 'gemini-2.5-flash';
  const fallbackModels = options.fallbackModels || ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];
  
  // Create ordered unique list of models to try
  const modelsToTry = [primaryModel, ...fallbackModels.filter((m) => m !== primaryModel)];
  
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    // 1 retry on same model if transient network, but switch models immediately on 503 High Demand
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: options.contents,
          config: options.config,
        });

        return response;
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
          // If model is overloaded or unavailable/discontinued, switch to the next fallback model immediately
          console.warn(`[Gemini API] Model ${currentModel} returned ${errorCode || 'error'} (${isModelUnavailable ? 'Unavailable/Discontinued' : 'High demand'}). Switching to next fallback model...`);
          break; // Break inner loop to try next model immediately
        }

        if (!isOtherRetryable) {
          // Non-retryable error (e.g. invalid parameter format)
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
