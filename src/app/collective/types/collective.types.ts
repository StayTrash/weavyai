import type { Node } from '@xyflow/react';

/**
 * Base interface for all collective node data
 */
export interface BaseCollectiveNodeData {
    label: string;
    sublabel?: string;
    width: number;
    height?: number;
    [key: string]: any;
}

/**
 * Data for image nodes in the collective section
 */
export interface CollectiveImageNodeData extends BaseCollectiveNodeData {
    image: string;
    avatar?: string;
    role?: string;
    bio?: string;
    description?: string;
    socials?: {
        linkedin?: string;
        instagram?: string;
    };
}

/**
 * Union type for all collective node data types
 */
export type CollectiveNodeData = CollectiveImageNodeData;

/**
 * Type for collective section nodes with proper data typing
 */
export type CollectiveNode = Node<CollectiveNodeData>;