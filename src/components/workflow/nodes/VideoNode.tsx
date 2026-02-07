'use client';

import * as React from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowState } from '@/stores/workflowStore';
import { type VideoFlowNode, VIDEO_HANDLES } from '@/types/workflow.types';
import { uploadVideoToTransloadit, type UploadProgress } from '@/lib/transloadit';
import {
    Film,
    Lock,
    Pause,
    Play,
    Plus,
    Upload,
    Volume2,
    VolumeX,
} from 'lucide-react';

import {
    NodeShell,
    HandleWithLabel,
    RenameDialog,
    NodeDropdownMenu,
} from '../primitives';

/**
 * VideoNode Component
 * 
 * A node for uploading and displaying videos.
 * Features:
 * - Video upload via Transloadit
 * - Video player preview with controls
 * - Progress indicator during upload
 * - Output handle for video URL
 */
export function VideoNode({ id, data, selected }: NodeProps<VideoFlowNode>) {
    const updateNodeData = useWorkflowStore((s: WorkflowState) => s.updateNodeData);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
    const [newLabel, setNewLabel] = React.useState(data.label || 'File');
    const [isMuted, setIsMuted] = React.useState(true);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    const displayLabel = data.label || 'File';
    const isLocked = data.isLocked || false;
    const videoUrl = data.videoUrl;
    const isUploading = data.isUploading || false;
    const uploadProgress = data.uploadProgress || 0;

    const handleRename = () => {
        if (newLabel.trim()) {
            updateNodeData<VideoFlowNode>(id, { label: newLabel.trim() });
        }
        setRenameDialogOpen(false);
    };

    const toggleLock = () => {
        updateNodeData<VideoFlowNode>(id, { isLocked: !isLocked });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
        if (!validTypes.includes(file.type)) {
            console.error('Invalid video type:', file.type);
            return;
        }

        updateNodeData<VideoFlowNode>(id, {
            isUploading: true,
            uploadProgress: 0,
            fileName: file.name,
        });

        const handleProgress = (progress: UploadProgress) => {
            updateNodeData<VideoFlowNode>(id, { uploadProgress: progress.percentage });
        };

        try {
            const result = await uploadVideoToTransloadit(file, handleProgress);

            if (result) {
                updateNodeData<VideoFlowNode>(id, {
                    videoUrl: result.ssl_url,
                    duration: result.duration,
                    isUploading: false,
                    uploadProgress: 100,
                });
            } else {
                updateNodeData<VideoFlowNode>(id, {
                    isUploading: false,
                    uploadProgress: 0,
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            updateNodeData<VideoFlowNode>(id, {
                isUploading: false,
                uploadProgress: 0,
            });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative group/node">
            {/* Output Handle */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(6px, -50%)' }}>
                <HandleWithLabel
                    type="source"
                    position={Position.Right}
                    id={VIDEO_HANDLES.OUTPUT}
                    nodeId={id}
                    label="Video"
                    color="cyan"
                />
            </div>

            <NodeShell
                title={displayLabel}
                icon={<Film className="h-4 w-4" />}
                selected={selected}
                className="w-90"
                right={
                    <div className="flex items-center gap-1">
                        {isLocked && <Lock className="h-4 w-4 text-foreground/50" />}
                        <NodeDropdownMenu
                            nodeId={id}
                            label={displayLabel}
                            isLocked={isLocked}
                            onToggleLock={toggleLock}
                            onOpenRename={() => {
                                setNewLabel(displayLabel);
                                setRenameDialogOpen(true);
                            }}
                        />
                    </div>
                }
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {!videoUrl && !isUploading ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className={cn(
                            'nodrag cursor-pointer rounded-lg border-2 border-dashed border-border/60',
                            'flex flex-col items-center justify-center gap-2 p-8',
                            'bg-muted/20 transition-colors hover:bg-muted/40 hover:border-purple-500/50'
                        )}
                    >
                        <Upload className="h-8 w-8 text-foreground/40" />
                        <div className="text-center text-sm text-foreground/60">
                            <div>Drag & drop or click to upload</div>
                            <div className="text-xs text-foreground/40 mt-1">MP4, MOV, WebM, M4V</div>
                        </div>
                    </div>
                ) : isUploading ? (
                    <div className="rounded-lg bg-muted/40 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-foreground/70">Uploading...</span>
                            <span className="text-sm text-foreground/70">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Video Player */}
                        <div className="relative rounded-lg overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full max-h-50 object-contain"
                                muted={isMuted}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => setIsPlaying(false)}
                            />
                            <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                                onClick={() => {
                                    if (videoRef.current) {
                                        if (videoRef.current.paused) {
                                            videoRef.current.play();
                                        } else {
                                            videoRef.current.pause();
                                        }
                                    }
                                }}
                            >
                                {isPlaying ? (
                                    <Pause className="h-12 w-12 text-white" />
                                ) : (
                                    <Play className="h-12 w-12 text-white" />
                                )}
                            </button>
                        </div>

                        {/* Video Controls */}
                        <div className="space-y-2">
                            {/* Time and Duration */}
                            <div className="flex items-center justify-between text-xs text-foreground/60">
                                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                <button
                                    type="button"
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-1 hover:text-foreground transition-colors"
                                >
                                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Seek Bar */}
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.1}
                                value={currentTime}
                                onChange={handleSeek}
                                className="nodrag w-full h-1 bg-muted rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="nodrag w-full mt-3 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    {videoUrl ? 'Upload different video' : 'Add more videos'}
                </button>
            </NodeShell>

            <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                value={newLabel}
                onChange={setNewLabel}
                onSubmit={handleRename}
            />
        </div>
    );
}
