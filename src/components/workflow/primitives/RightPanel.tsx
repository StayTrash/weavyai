'use client';

import * as React from 'react';
import { Panel } from '@xyflow/react';
import { PiShareLight } from 'react-icons/pi';
import { TbAsterisk } from 'react-icons/tb';
import { Check, Clock, Download, Loader2, Play, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/stores/workflowStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RightPanelProps {
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onRunAll?: () => void;
  onRunSelected?: () => void;
  hasSelectedNodes?: boolean;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

/**
 * RightPanel Component
 * 
 * Top-right panel containing:
 * - Credits display
 * - Share button
 * - Save status indicator
 * - Import/Export buttons
 * - Run All / Run Selected buttons
 * - History toggle
 * 
 * When history panel is open, this panel shifts to the left.
 */
export function RightPanel({
  isSaving,
  isDirty,
  onSave,
  onRunAll,
  onRunSelected,
  hasSelectedNodes = false,
  isHistoryOpen,
  onToggleHistory,
}: RightPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const exportWorkflow = useWorkflowStore((s) => s.exportWorkflow);
  const importWorkflow = useWorkflowStore((s) => s.importWorkflow);
  const nodes = useWorkflowStore((s) => s.nodes);
  const hasNodes = nodes.length > 0;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importWorkflow(file);
      if (success) {
        console.log('Workflow imported successfully');
      } else {
        console.error('Failed to import workflow');
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Credits and controls panel */}
      <Panel
        position="top-right"
        className="pointer-events-auto transition-all duration-300"
        style={{
          margin: 24,
          marginRight: isHistoryOpen ? 404 : 24, // 380px history panel + 24px margin
        }}
      >
        <div className="w-[280px] rounded-md border border-border/60 bg-card/80 backdrop-blur p-3 shadow-lg">
          {/* Top row: Credits + Share */}
          <div className="flex items-center justify-between">
            <div className="text-[14px] flex items-center gap-1 font-medium text-foreground">
              <TbAsterisk className="text-[16px]" />
              <p>100 credits</p>
            </div>
            {/* <Button
              size="sm"
              className="h-8 rounded-md bg-[#faffc7] text-black hover:bg-[#f0f5a0] px-4"
            >
              <PiShareLight className="mr-2 h-4 w-4" />
              Share
            </Button> */}
          </div>

          {/* Save status indicator with Save button */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <span className="flex items-center gap-1 text-foreground/60">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              ) : !isDirty ? (
                <span className="flex items-center gap-1 text-green-500/80">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-foreground/50">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Unsaved
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors',
                isDirty && !isSaving
                  ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  : 'text-foreground/40 cursor-not-allowed'
              )}
              title="Ctrl+S"
            >
              <Save className="h-3 w-3" />
              <span>Save</span>
              <span className="text-[10px] text-foreground/40 ml-1">⌘S</span>
            </button>
          </div>

          {/* Import/Export Buttons */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleImportClick}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
              title="Import workflow from JSON"
            >
              <Upload className="h-3 w-3" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={exportWorkflow}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
              title="Export workflow as JSON"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-border/60" />

          {/* Run Controls + History */}
          <div className="flex items-center gap-2">
            {/* Run All */}
            {onRunAll && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Run All"
                    disabled={!hasNodes}
                    onClick={onRunAll}
                    className={cn(
                      'flex-1 flex h-9 items-center justify-center gap-1.5 rounded-md transition-colors',
                      hasNodes
                        ? 'bg-black hover:bg-black/90 text-white'
                        : 'bg-black/30 text-white/50 cursor-not-allowed'
                    )}
                  >
                    <Play className="h-4 w-4" />
                    <span className="text-xs font-medium">Run All</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Run entire workflow</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Run Selected */}
            {onRunSelected && hasSelectedNodes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Run Selected"
                    onClick={onRunSelected}
                    className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-md bg-black/80 hover:bg-black text-white transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Run Selected</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Run selected nodes</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* History Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Workflow History"
                  aria-pressed={isHistoryOpen}
                  onClick={onToggleHistory}
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-md transition-colors',
                    isHistoryOpen
                      ? 'bg-purple-600 text-white'
                      : 'text-foreground/80 hover:bg-muted/40'
                  )}
                >
                  <Clock className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isHistoryOpen ? 'Close History' : 'Workflow History'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Panel>
    </TooltipProvider>
  );
}
