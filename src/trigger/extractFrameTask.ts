/**
 * Extract Frame Task - Trigger.dev Task for Video Frame Extraction
 *
 * Extracts a single frame from a video at a given timestamp using FFmpeg.
 * Timestamp can be in seconds or as a percentage of duration (e.g. 50 for "50%").
 * Result is uploaded via Transloadit.
 */

import { task, logger } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// ============================================================================
// Types
// ============================================================================

export interface ExtractFrameTaskPayload {
    videoUrl: string;
    /** Timestamp in seconds */
    timestamp: number;
    /** Optional: 0–100, extract at this percentage of duration (e.g. 50 for "50%") */
    timestampPercent?: number;
}

export interface ExtractFrameTaskResult {
    frameImageUrl: string;
}

const TRANSLOADIT_AUTH_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || "";

// ============================================================================
// Helpers
// ============================================================================

async function getFfprobePath(): Promise<string> {
    const ffprobeStatic = await import("ffprobe-static");
    const p = (ffprobeStatic as { path: string }).path;
    if (!p) throw new Error("ffprobe-static path not found");
    return p;
}

async function getFfmpegPath(): Promise<string> {
    const m = await import("ffmpeg-static");
    const p = typeof m === "string" ? m : (m as { default?: string | null }).default;
    if (typeof p !== "string" || !p) throw new Error("ffmpeg-static path not found");
    return p;
}

/** Get video duration in seconds using ffprobe */
async function getVideoDuration(filePath: string): Promise<number> {
    const ffprobePath = await getFfprobePath();
    const out = execSync(
        `"${ffprobePath}" -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "${filePath}"`,
        { encoding: "utf-8", maxBuffer: 10 * 1024 }
    ).trim();
    const duration = parseFloat(out);
    if (!Number.isFinite(duration) || duration < 0) {
        throw new Error(`Could not get video duration: ${out}`);
    }
    return duration;
}

/** Upload image file to Transloadit and return URL */
async function uploadFrameToTransloadit(localPath: string): Promise<string> {
    if (!TRANSLOADIT_AUTH_KEY) {
        throw new Error("NEXT_PUBLIC_TRANSLOADIT_KEY is not configured.");
    }
    const fileBuffer = await fs.readFile(localPath);
    const fileName = path.basename(localPath);
    const params = {
        auth: { key: TRANSLOADIT_AUTH_KEY },
        steps: {
            imported: { robot: "/file/import", result: true },
        },
    };
    const form = new FormData();
    form.append("params", JSON.stringify(params));
    form.append("imported", new Blob([fileBuffer]), fileName);

    const response = await fetch("https://api2.transloadit.com/assemblies", {
        method: "POST",
        body: form,
    });

    const data = (await response.json()) as {
        assembly_ssl_url?: string;
        error?: string;
        message?: string;
    };

    if (data.error || data.message) {
        throw new Error(data.message || data.error || "Transloadit assembly failed");
    }

    const assemblyUrl = data.assembly_ssl_url;
    if (!assemblyUrl) throw new Error("No assembly URL in response");

    for (let attempt = 0; attempt < 90; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(assemblyUrl);
        const pollData = (await pollRes.json()) as {
            ok?: string;
            results?: { imported?: { ssl_url?: string }[] };
            error?: string;
        };
        if (pollData.ok === "ASSEMBLY_COMPLETED") {
            const url = pollData.results?.imported?.[0]?.ssl_url;
            if (url) return url;
            throw new Error("No import URL in assembly result");
        }
        if (pollData.error) throw new Error(pollData.error);
    }

    throw new Error("Transloadit assembly timed out");
}

// ============================================================================
// Task Definition
// ============================================================================

export const extractFrameTask = task({
    id: "extract-video-frame",
    maxDuration: 300,
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 5000,
        factor: 2,
    },
    run: async (payload: ExtractFrameTaskPayload): Promise<ExtractFrameTaskResult> => {
        const videoUrl = String(payload.videoUrl ?? "");
        const timestamp = Number(payload.timestamp);
        const timestampPercent = payload.timestampPercent != null ? Number(payload.timestampPercent) : undefined;

        logger.info("Starting extract frame task (FFmpeg)", {
            videoUrl: videoUrl.substring(0, 50) + "...",
            timestamp,
            timestampPercent,
        });

        /** Extract a single frame via Transloadit (no FFmpeg). offsetSeconds used for /video/thumbs. */
        async function extractFrameViaTransloadit(offsetSeconds: number): Promise<string> {
            if (!TRANSLOADIT_AUTH_KEY) {
                throw new Error("NEXT_PUBLIC_TRANSLOADIT_KEY is not configured");
            }
            const params = {
                auth: { key: TRANSLOADIT_AUTH_KEY },
                steps: {
                    imported: { robot: "/http/import", url: videoUrl },
                    frame: {
                        use: "imported",
                        robot: "/video/thumbs",
                        count: 1,
                        offsets: [offsetSeconds],
                        result: true,
                    },
                },
            };
            const res = await fetch("https://api2.transloadit.com/assemblies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ params: JSON.stringify(params) }),
            });
            const data = (await res.json()) as {
                assembly_ssl_url?: string;
                error?: string;
            };
            if (data.error || !data.assembly_ssl_url) {
                throw new Error(data.error || "Transloadit assembly failed");
            }
            for (let i = 0; i < 90; i++) {
                await new Promise((r) => setTimeout(r, 1000));
                const poll = await fetch(data.assembly_ssl_url);
                const pollJson = (await poll.json()) as {
                    ok?: string;
                    results?: { frame?: { ssl_url?: string }[] };
                };
                if (pollJson.ok === "ASSEMBLY_COMPLETED") {
                    const u = pollJson.results?.frame?.[0]?.ssl_url;
                    if (u) return u;
                }
                if (i === 89) throw new Error("Transloadit assembly timed out");
            }
            throw new Error("Transloadit assembly timed out");
        }

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "extract-frame-"));
        const videoPath = path.join(tmpDir, "video");
        const framePath = path.join(tmpDir, "frame.jpg");

        try {
            let frameUrl = "";

            try {
                // 1. Download video (no extension - ffprobe/ffmpeg detect format)
                const videoRes = await fetch(videoUrl);
                if (!videoRes.ok) {
                    throw new Error(`Failed to fetch video: ${videoRes.status}`);
                }
                const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                await fs.writeFile(videoPath, videoBuffer);

                // 2. Resolve timestamp: if percentage, get duration first
                let timestampSeconds = Number(timestamp);
                if (timestampPercent != null) {
                    const duration = await getVideoDuration(videoPath);
                    timestampSeconds = (Number(duration) * timestampPercent) / 100;
                    logger.info("Resolved timestamp from percentage", {
                        duration,
                        timestampPercent,
                        timestampSeconds,
                    });
                }

                // 3. Extract frame with FFmpeg
                const ffmpegPath = await getFfmpegPath();
                execSync(
                    `"${ffmpegPath}" -y -ss ${timestampSeconds} -i "${videoPath}" -vframes 1 -q:v 2 "${framePath}"`,
                    { maxBuffer: 50 * 1024 * 1024 }
                );

                // 4. Upload frame to Transloadit (or fallback to Transloadit video/thumbs)
                try {
                    frameUrl = await uploadFrameToTransloadit(framePath);
                } catch (uploadErr) {
                    logger.warn("Transloadit file upload failed; using Transloadit video/thumbs fallback", {
                        error: uploadErr,
                    });
                    frameUrl = await extractFrameViaTransloadit(timestampSeconds);
                }
            } catch (ffmpegErr) {
                // FFmpeg/ffprobe not available (e.g. Trigger.dev bundle) -> use Transloadit-only
                logger.warn("FFmpeg extract failed; using Transloadit video/thumbs", {
                    error: ffmpegErr,
                });
                const offsetSeconds =
                    timestampPercent != null
                        ? (timestampPercent / 100) * 60
                        : Number(timestamp);
                frameUrl = await extractFrameViaTransloadit(offsetSeconds);
            }

            if (!frameUrl) {
                throw new Error("Failed to get frame image URL");
            }

            logger.info("Extract frame task completed", {
                frameUrl: frameUrl.substring(0, 50) + "...",
            });

            return { frameImageUrl: frameUrl };
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    },
});
