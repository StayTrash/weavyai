'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getAuthUser } from '@/lib/auth-server';

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

function detectImageMimeType(imageBase64: string): string {
    if (imageBase64.startsWith('/9j/')) return 'image/jpeg';
    if (imageBase64.startsWith('iVBORw')) return 'image/png';
    if (imageBase64.startsWith('R0lGOD')) return 'image/gif';
    if (imageBase64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg';
}

export type LlmModel = 'gemini-2.5-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.0-pro';

export async function runLlm(input: {
    model: LlmModel;
    systemPrompt?: string;
    userMessage: string;
    images?: string[];
}) {
    await getAuthUser();

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: input.model,
        safetySettings: SAFETY_SETTINGS,
    });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (input.systemPrompt) {
        parts.push({ text: `System Instructions: ${input.systemPrompt}\n\n` });
    }
    parts.push({ text: input.userMessage });
    if (input.images?.length) {
        for (const imageBase64 of input.images) {
            parts.push({
                inlineData: {
                    mimeType: detectImageMimeType(imageBase64),
                    data: imageBase64,
                },
            });
        }
    }

    try {
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        return { output: text };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('quota') || msg.includes('rate')) {
            throw new Error('API quota exceeded. Please try again later or check your API key limits.');
        }
        if (msg.includes('API key') || msg.includes('authentication')) {
            throw new Error('Invalid API key. Please check your GOOGLE_GEMINI_API_KEY.');
        }
        throw error;
    }
}
