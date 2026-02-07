/**
 * Trigger.dev API Route
 * 
 * API endpoint for triggering Trigger.dev tasks from the client.
 * Handles LLM, Crop Image, and Extract Frame tasks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasks, runs } from '@trigger.dev/sdk/v3';
import type { LLMTaskPayload } from '@/trigger/llmTask';
import type { CropImageTaskPayload } from '@/trigger/cropImageTask';
import type { ExtractFrameTaskPayload } from '@/trigger/extractFrameTask';

// Task type definitions
type TaskType = 'llm' | 'crop-image' | 'extract-frame';

interface TriggerRequest {
    taskType: TaskType;
    payload: LLMTaskPayload | CropImageTaskPayload | ExtractFrameTaskPayload;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as TriggerRequest;
        const { taskType, payload } = body;

        if (!taskType || !payload) {
            return NextResponse.json(
                { error: 'Missing taskType or payload' },
                { status: 400 }
            );
        }

        let handle;

        switch (taskType) {
            case 'llm':
                handle = await tasks.trigger('llm-gemini', payload as LLMTaskPayload);
                break;
            case 'crop-image':
                handle = await tasks.trigger('crop-image', payload as CropImageTaskPayload);
                break;
            case 'extract-frame':
                handle = await tasks.trigger('extract-video-frame', payload as ExtractFrameTaskPayload);
                break;
            default:
                return NextResponse.json(
                    { error: `Unknown task type: ${taskType}` },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            runId: handle.id,
            publicAccessToken: handle.publicAccessToken,
        });
    } catch (error) {
        console.error('Trigger API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Poll for task result
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const runId = searchParams.get('runId');

        if (!runId) {
            return NextResponse.json(
                { error: 'Missing runId parameter' },
                { status: 400 }
            );
        }

        const run = await runs.retrieve(runId);

        return NextResponse.json({
            runId: run.id,
            status: run.status,
            output: run.output,
            error: run.error,
            isCompleted: run.status === 'COMPLETED',
            isFailed: run.status === 'FAILED' || run.status === 'CANCELED' || run.status === 'SYSTEM_FAILURE',
        });
    } catch (error) {
        console.error('Trigger poll error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
