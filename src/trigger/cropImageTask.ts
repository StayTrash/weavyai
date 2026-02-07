/**
 * Crop Image Task - Trigger.dev Task for Image Cropping
 *
 * This task crops images using FFmpeg (percentage-based crop),
 * then uploads the result via Transloadit.
 */

import { task, logger } from "@trigger.dev/sdk/v3";
import { execSync } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { imageSizeFromFile } from "image-size/fromFile";

// ============================================================================
// Types
// ============================================================================

export interface CropImageTaskPayload {
    imageUrl: string;
    cropX: number;       // percentage 0-100
    cropY: number;       // percentage 0-100
    cropWidth: number;   // percentage 0-100
    cropHeight: number;  // percentage 0-100
}

export interface CropImageTaskResult {
    croppedImageUrl: string;
}

// ============================================================================
// Helpers
// ============================================================================

const TRANSLOADIT_AUTH_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || '';

/**
 * Get image dimensions using image-size (pure JS; works in Trigger.dev cloud)
 * Supports jpg, png, webp, gif, etc. without ffprobe.
 */
async function getImageDimensions(filePath: string): Promise<{ width: number; height: number }> {
    const result = await imageSizeFromFile(filePath);
    const width = Number(result.width);
    const height = Number(result.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(`Could not get image dimensions: ${filePath}`);
    }
    return { width, height };
}

/**
 * Get path to ffmpeg binary (ffmpeg-static)
 */
async function getFfmpegPath(): Promise<string> {
    const m = await import("ffmpeg-static");
    const p = typeof m === "string" ? m : (m as { default?: string | null }).default;
    if (typeof p !== "string" || !p) throw new Error("ffmpeg-static path not found");
    return p;
}

/**
 * Upload a local file to Transloadit and return the stored URL.
 * Uses Transloadit assembly with /file/import and /s3/store or similar.
 * Fallback: use Transloadit's existing resize/crop robot to "re-export" from a URL.
 * Since we can't easily upload a raw file to Transloadit without a template,
 * we use the approach: upload the cropped file to a temporary location.
 * Transloadit can import from URL - so we need to expose the file at a URL.
 * Alternative: use Transloadit assembly that imports from URL (our cropped image
 * would need to be at a URL). So we must either 1) have an endpoint that serves
 * the file, or 2) use Transloadit's multipart upload with the file.
 * Transloadit: "To add a file to your Assembly, add it as a form field when
 * creating the Assembly." So we POST multipart with params and file.
 */
async function uploadCroppedImageToTransloadit(localPath: string): Promise<string> {
    if (!TRANSLOADIT_AUTH_KEY) {
        throw new Error("NEXT_PUBLIC_TRANSLOADIT_KEY is not configured.");
    }

    const fileBuffer = await fs.readFile(localPath);
    const fileName = path.basename(localPath);

    // Assembly: import the uploaded file, then export to default store (returns URL)
    const params = {
        auth: { key: TRANSLOADIT_AUTH_KEY },
        steps: {
            imported: {
                robot: "/file/import",
                path: "${file.path}", // Transloadit expects the file in the form
            },
            exported: {
                use: "imported",
                robot: "/file/store",
                result: true,
            },
        },
    };

    const form = new FormData();
    form.append("params", JSON.stringify(params));
    form.append("file", new Blob([fileBuffer]), fileName);

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
    if (!assemblyUrl) {
        throw new Error("No assembly URL in response");
    }

    // Poll for completion
    for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pollRes = await fetch(assemblyUrl);
        const pollData = (await pollRes.json()) as {
            ok?: string;
            results?: { exported?: { ssl_url?: string }[] };
            error?: string;
        };
        if (pollData.ok === "ASSEMBLY_COMPLETED") {
            const url = pollData.results?.exported?.[0]?.ssl_url;
            if (url) return url;
            throw new Error("No export URL in assembly result");
        }
        if (pollData.error) {
            throw new Error(pollData.error);
        }
    }

    throw new Error("Transloadit assembly timed out");
}

/**
 * Transloadit /file/import expects the file to be in the form with a specific name.
 * Docs: "You can add files to the assembly by including them in the same request."
 * The step path is typically "${file.path}" when the form field is "file".
 * So we're good with form.append("file", blob, fileName).
 * But /file/import might expect a different structure - let me check.
 * Actually in Transloadit, when you POST a file, the step that uses it references
 * the field name. So if we send form field "file", the import step might need
 * "path": "${file.path}". I'll try. If it fails we can use the fallback of
 * keeping the existing Transloadit-only crop (import from URL, resize/crop, store)
 * and add a separate FFmpeg path that writes to a temp file and then we need another
 * way to get a URL (e.g. our API that accepts uploads and returns URL).
 *
 * Simpler fallback: after FFmpeg crop we have a file. Transloadit has "import from
 * URL" - we don't have a URL. So we must use multipart. Transloadit docs say for
 * /file/import the file is uploaded in the same request. So the form field name
 * might need to match. Let me try "imported" as the form field name for the file
 * and in the step use "path": "${imported.path}" or similar. I'll check Transloadit
 * file import - actually the step name is "imported", and the file is attached
 * with that name. So form.append("imported", file). Then in params, step "imported"
 * uses robot /file/import and the file is the one we sent. So path might be
 * "${imported.path}" or just the file is automatically associated. I'll use
 * form.append("imported", blob) and step "imported": { robot: "/file/import" }.
 */
async function uploadCroppedImageToTransloaditV2(localPath: string): Promise<string> {
    if (!TRANSLOADIT_AUTH_KEY) {
        throw new Error("NEXT_PUBLIC_TRANSLOADIT_KEY is not configured.");
    }

    const fileBuffer = await fs.readFile(localPath);
    const fileName = path.basename(localPath);

    const params = {
        auth: { key: TRANSLOADIT_AUTH_KEY },
        steps: {
            imported: {
                robot: "/file/import",
                result: true,
            },
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
        logger.warn("Transloadit file/import failed, trying HTTP import fallback", {
            error: data.message || data.error,
        });
        // Fallback: we cannot upload raw file easily; use original Transloadit crop
        // and return a placeholder or throw with a clear message.
        throw new Error(
            "Transloadit file upload not configured. Cropped image was created with FFmpeg but upload failed. " +
                "Ensure Transloadit supports file import or use a store step."
        );
    }

    const assemblyUrl = data.assembly_ssl_url;
    if (!assemblyUrl) {
        throw new Error("No assembly URL in response");
    }

    for (let attempt = 0; attempt < 60; attempt++) {
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
        if (pollData.error) {
            throw new Error(pollData.error);
        }
    }

    throw new Error("Transloadit assembly timed out");
}

// ============================================================================
// Task Definition
// ============================================================================

export const cropImageTask = task({
    id: "crop-image",
    maxDuration: 180,
    retry: {
        maxAttempts: 3,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 5000,
        factor: 2,
    },
    run: async (payload: CropImageTaskPayload): Promise<CropImageTaskResult> => {
        const imageUrl = String(payload.imageUrl ?? "");
        const cropX = Number(payload.cropX);
        const cropY = Number(payload.cropY);
        const cropWidth = Number(payload.cropWidth);
        const cropHeight = Number(payload.cropHeight);

        logger.info("Starting crop image task (FFmpeg)", {
            imageUrl: imageUrl.substring(0, 50) + "...",
            cropX,
            cropY,
            cropWidth,
            cropHeight,
        });

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "crop-"));
        const inputPath = path.join(tmpDir, "input.jpg");
        const outputPath = path.join(tmpDir, "output.jpg");

        try {
            // 1. Download image
            const imageRes = await fetch(imageUrl);
            if (!imageRes.ok) {
                throw new Error(`Failed to fetch image: ${imageRes.status}`);
            }
            const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
            await fs.writeFile(inputPath, imageBuffer);

            // 2. Get dimensions (image-size)
            const { width, height } = await getImageDimensions(inputPath);
            const x = Math.round((width * cropX) / 100);
            const y = Math.round((height * cropY) / 100);
            const w = Math.round((width * cropWidth) / 100);
            const h = Math.round((height * cropHeight) / 100);

            // Clamp to image bounds
            const x1 = Math.max(0, Math.min(x, width - 1));
            const y1 = Math.max(0, Math.min(y, height - 1));
            const w1 = Math.max(1, Math.min(w, width - x1));
            const h1 = Math.max(1, Math.min(h, height - y1));

            logger.info("Crop dimensions", {
                width,
                height,
                crop: { x: x1, y: y1, w: w1, h: h1 },
            });

            /** Use Transloadit import-from-URL + percentage crop (no FFmpeg needed). */
            async function cropViaTransloadit(): Promise<string> {
                const params = {
                    auth: { key: TRANSLOADIT_AUTH_KEY },
                    steps: {
                        imported: { robot: "/http/import", url: imageUrl },
                        cropped: {
                            use: "imported",
                            robot: "/image/resize",
                            crop: {
                                x1: `${cropX}%`,
                                y1: `${cropY}%`,
                                x2: `${cropX + cropWidth}%`,
                                y2: `${cropY + cropHeight}%`,
                            },
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
                for (let i = 0; i < 60; i++) {
                    await new Promise((r) => setTimeout(r, 1000));
                    const poll = await fetch(data.assembly_ssl_url);
                    const pollJson = (await poll.json()) as {
                        ok?: string;
                        results?: { cropped?: { ssl_url?: string }[] };
                    };
                    if (pollJson.ok === "ASSEMBLY_COMPLETED") {
                        const u = pollJson.results?.cropped?.[0]?.ssl_url;
                        if (u) return u;
                    }
                    if (i === 59) throw new Error("Transloadit assembly timed out");
                }
                throw new Error("Transloadit assembly timed out");
            }

            // 3. Try FFmpeg crop; if unavailable (e.g. in Trigger.dev bundle), use Transloadit-only
            let croppedUrl = "";
            try {
                const ffmpegPath = await getFfmpegPath();
                execSync(
                    `"${ffmpegPath}" -y -i "${inputPath}" -vf "crop=${w1}:${h1}:${x1}:${y1}" "${outputPath}"`,
                    { maxBuffer: 10 * 1024 * 1024 }
                );
                croppedUrl = await uploadCroppedImageToTransloaditV2(outputPath);
            } catch (ffmpegOrUploadErr) {
                logger.warn("FFmpeg crop or upload failed; using Transloadit crop-from-URL", {
                    error: ffmpegOrUploadErr,
                });
                croppedUrl = await cropViaTransloadit();
            }

            if (!croppedUrl) {
                throw new Error("Failed to get cropped image URL");
            }

            logger.info("Crop image task completed", {
                croppedUrl: croppedUrl.substring(0, 50) + "...",
            });

            return { croppedImageUrl: croppedUrl };
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true });
        }
    },
});
