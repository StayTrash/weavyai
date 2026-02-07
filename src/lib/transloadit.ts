/**
 * Transloadit Integration
 * 
 * Handles file uploads to Transloadit for images and videos.
 * Uses client-side assemblies with signature authentication.
 */

// Transloadit configuration
const TRANSLOADIT_AUTH_KEY = process.env.NEXT_PUBLIC_TRANSLOADIT_AUTH_KEY || '';

export interface TransloaditResult {
    url: string;
    ssl_url: string;
    name: string;
    basename: string;
    ext: string;
    size: number;
    mime: string;
    width?: number;
    height?: number;
    duration?: number;
}

export interface UploadProgress {
    bytesReceived: number;
    bytesExpected: number;
    percentage: number;
}

export interface TransloaditAssemblyResult {
    ok: string;
    assembly_id: string;
    assembly_ssl_url: string;
    results: {
        [stepName: string]: TransloaditResult[];
    };
}

/**
 * Upload an image file to Transloadit
 */
export async function uploadImageToTransloadit(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<TransloaditResult | null> {
    return uploadToTransloadit(file, 'image', onProgress);
}

/**
 * Upload a video file to Transloadit
 */
export async function uploadVideoToTransloadit(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<TransloaditResult | null> {
    return uploadToTransloadit(file, 'video', onProgress);
}

/**
 * Generic upload function
 */
async function uploadToTransloadit(
    file: File,
    type: 'image' | 'video',
    onProgress?: (progress: UploadProgress) => void
): Promise<TransloaditResult | null> {
    const formData = new FormData();
    formData.append('file', file);

    // Create assembly params based on type
    const steps = type === 'image'
        ? {
            ':original': {
                robot: '/upload/handle',
            },
            optimized: {
                use: ':original',
                robot: '/image/optimize',
                result: true,
            },
        }
        : {
            ':original': {
                robot: '/upload/handle',
            },
            encoded: {
                use: ':original',
                robot: '/video/encode',
                preset: 'webm',
                result: true,
            },
        };

    const params = {
        auth: {
            key: TRANSLOADIT_AUTH_KEY,
        },
        steps,
    };

    formData.append('params', JSON.stringify(params));

    try {
        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress({
                        bytesReceived: event.loaded,
                        bytesExpected: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100),
                    });
                }
            });

            xhr.addEventListener('load', async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);

                    // Poll for assembly completion
                    const result = await pollAssemblyStatus(response.assembly_ssl_url);
                    if (result && result.ok === 'ASSEMBLY_COMPLETED') {
                        const resultKey = type === 'image' ? 'optimized' : 'encoded';
                        const files = result.results[resultKey] || result.results[':original'];
                        resolve(files?.[0] || null);
                    } else {
                        reject(new Error('Assembly failed'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', 'https://api2.transloadit.com/assemblies');
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Transloadit upload error:', error);
        return null;
    }
}

/**
 * Poll assembly status until complete
 */
async function pollAssemblyStatus(
    assemblyUrl: string,
    maxAttempts = 60,
    intervalMs = 1000
): Promise<TransloaditAssemblyResult | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(assemblyUrl);
            const data = await response.json();

            if (data.ok === 'ASSEMBLY_COMPLETED') {
                return data;
            } else if (data.ok === 'ASSEMBLY_EXECUTING' || data.ok === 'ASSEMBLY_UPLOADING') {
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            } else if (data.error) {
                console.error('Assembly error:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Polling error:', error);
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    return null;
}

/**
 * Crop an image using Transloadit
 */
export async function cropImageWithTransloadit(
    imageUrl: string,
    cropX: number, // percentage 0-100
    cropY: number,
    cropWidth: number,
    cropHeight: number
): Promise<string | null> {
    const params = {
        auth: {
            key: TRANSLOADIT_AUTH_KEY,
        },
        steps: {
            imported: {
                robot: '/http/import',
                url: imageUrl,
            },
            cropped: {
                use: 'imported',
                robot: '/image/resize',
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

    try {
        const response = await fetch('https://api2.transloadit.com/assemblies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ params: JSON.stringify(params) }),
        });

        const data = await response.json();
        const result = await pollAssemblyStatus(data.assembly_ssl_url);

        if (result && result.ok === 'ASSEMBLY_COMPLETED') {
            return result.results.cropped?.[0]?.ssl_url || null;
        }
    } catch (error) {
        console.error('Crop error:', error);
    }

    return null;
}

/**
 * Extract a frame from video using Transloadit
 */
export async function extractFrameFromVideo(
    videoUrl: string,
    timestamp: number // seconds
): Promise<string | null> {
    const params = {
        auth: {
            key: TRANSLOADIT_AUTH_KEY,
        },
        steps: {
            imported: {
                robot: '/http/import',
                url: videoUrl,
            },
            frame: {
                use: 'imported',
                robot: '/video/thumbs',
                count: 1,
                offsets: [timestamp],
                result: true,
            },
        },
    };

    try {
        const response = await fetch('https://api2.transloadit.com/assemblies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ params: JSON.stringify(params) }),
        });

        const data = await response.json();
        const result = await pollAssemblyStatus(data.assembly_ssl_url);

        if (result && result.ok === 'ASSEMBLY_COMPLETED') {
            return result.results.frame?.[0]?.ssl_url || null;
        }
    } catch (error) {
        console.error('Frame extraction error:', error);
    }

    return null;
}

/**
 * Fetch image as base64 for LLM API calls
 */
export async function urlToBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('URL to base64 conversion error:', error);
        return null;
    }
}
