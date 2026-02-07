/**
 * LLM Task - Trigger.dev Task for Google Gemini API
 * 
 * This task runs LLM inference using the Google Gemini API.
 * Supports multimodal prompts with images.
 */

import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// ============================================================================
// Types
// ============================================================================

export interface LLMTaskPayload {
    model: 'gemini-2.5-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.0-pro';
    systemPrompt?: string;
    userMessage: string;
    images?: string[]; // base64 encoded without data URI prefix
}

export interface LLMTaskResult {
    output: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Detect MIME type from base64 image data
 */
const detectImageMimeType = (imageBase64: string): string => {
    if (imageBase64.startsWith('/9j/')) return 'image/jpeg';
    if (imageBase64.startsWith('iVBORw')) return 'image/png';
    if (imageBase64.startsWith('R0lGOD')) return 'image/gif';
    if (imageBase64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
};

/**
 * Default safety settings for Gemini
 */
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// ============================================================================
// Task Definition
// ============================================================================

export const llmTask = task({
    id: "llm-gemini",
    maxDuration: 120, // 2 minutes max for LLM calls
    retry: {
        maxAttempts: 2,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 5000,
        factor: 2,
    },
    run: async (payload: LLMTaskPayload): Promise<LLMTaskResult> => {
        const { model, systemPrompt, userMessage, images } = payload;

        logger.info("Starting LLM task", { model, hasSystemPrompt: !!systemPrompt, imageCount: images?.length ?? 0 });

        // Check for API key
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_GEMINI_API_KEY is not configured. Please add it to your environment variables.");
        }

        // Build the prompt parts
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        // Add system prompt if provided
        if (systemPrompt) {
            parts.push({ text: `System Instructions: ${systemPrompt}\n\n` });
        }

        // Add user message
        parts.push({ text: userMessage });

        // Add images if provided (multimodal support)
        if (images && images.length > 0) {
            logger.info("Adding images to prompt", { count: images.length });
            for (const imageBase64 of images) {
                parts.push({
                    inlineData: {
                        mimeType: detectImageMimeType(imageBase64),
                        data: imageBase64,
                    },
                });
            }
        }

        const callGemini = async (key: string) => {
            const genAI = new GoogleGenerativeAI(key);
            const generativeModel = genAI.getGenerativeModel({ model, safetySettings: SAFETY_SETTINGS });
            const result = await generativeModel.generateContent(parts);
            const response = await result.response;
            return response.text();
        };

        try {
            logger.info("Calling Gemini API...");
            const text = await callGemini(apiKey);
            logger.info("LLM task completed", { outputLength: text.length });
            return { output: text };
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            const msg = err.message.toLowerCase();
            const isQuotaOrRate = msg.includes('quota') || msg.includes('rate') || msg.includes('429') || msg.includes('resource_exhausted');

            if (isQuotaOrRate) {
                const backupKey = process.env.GOOGLE_GEMINI_API_KEY_BACKUP;
                if (backupKey && backupKey !== apiKey) {
                    logger.info("Quota/rate limit hit with primary key, retrying with backup key...");
                    try {
                        const text = await callGemini(backupKey);
                        logger.info("LLM task completed with backup key", { outputLength: text.length });
                        return { output: text };
                    } catch (backupError) {
                        logger.error("Backup key also failed", { error: backupError });
                    }
                }
                throw new Error(
                    `API quota exceeded. Please try again later or check your API key limits. (API: ${err.message})`
                );
            }

            if (msg.includes('api key') || msg.includes('authentication')) {
                throw new Error(`Invalid API key. Please check your GOOGLE_GEMINI_API_KEY. (API: ${err.message})`);
            }

            throw error;
        }
    },
});
