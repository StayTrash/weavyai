'use client';

import * as React from 'react';
import { Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowState } from '@/stores/workflowStore';
import { type TextFlowNode } from '@/types/workflow.types';
import { Type, Lock } from 'lucide-react';

import {
  NodeShell,
  HandleWithLabel,
  RenameDialog,
  NodeDropdownMenu,
} from '../primitives';

/**
 * TextNode Component
 * 
 * A node for entering and displaying text content.
 * Features:
 * - Editable text area
 * - Output handle (right) for sending text data
 * - Rename, lock, duplicate, and delete actions
 */
export function TextNode({ id, data, selected }: NodeProps<TextFlowNode>) {
  const updateNodeData = useWorkflowStore((s: WorkflowState) => s.updateNodeData);

  // Defensive check for undefined data
  const safeData = data || { label: 'Text', text: '', isLocked: false };

  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState(safeData.label || 'Text');

  const displayLabel = safeData.label || 'Text';
  const isLocked = safeData.isLocked || false;

  const handleRename = () => {
    if (newLabel.trim()) {
      updateNodeData<TextFlowNode>(id, { label: newLabel.trim() });
    }
    setRenameDialogOpen(false);
  };

  const toggleLock = () => {
    updateNodeData<TextFlowNode>(id, { isLocked: !isLocked });
  };

  return (
    <div className="relative group/node">
      {/* Output Handle */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{ transform: 'translate(6px, -50%)' }}>
        <HandleWithLabel
          type="source"
          position={Position.Right}
          id="output"
          nodeId={id}
          label="output"
          color="green"
        />
      </div>

      <NodeShell
        title={displayLabel}
        icon={<Type className="h-4 w-4" />}
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
        <textarea
          value={safeData.text || ''}
          onChange={(e) => updateNodeData<TextFlowNode>(id, { text: e.target.value })}
          placeholder="Enter your text here..."
          className={cn(
            'nodrag w-full resize-none rounded-lg bg-muted/40 p-3',
            'text-sm leading-relaxed text-foreground/90',
            'placeholder:text-foreground/40 outline-none',
            'focus:ring-2 focus:ring-purple-500/50',
            'min-h-25'
          )}
        />
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
