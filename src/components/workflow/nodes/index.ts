import { TextNode } from './TextNode';
import { ImageNode } from './ImageNode';
import { VideoNode } from './VideoNode';
import { CropImageNode } from './CropImageNode';
import { ExtractFrameNode } from './ExtractFrameNode';
import { LLMNode } from './LLMNode';

export { TextNode, ImageNode, VideoNode, CropImageNode, ExtractFrameNode, LLMNode };

/**
 * Node Types Export
 * 
 * Maps node type strings to their respective components
 * for use with React Flow.
 */
export const workflowNodeTypes = {
    text: TextNode,
    image: ImageNode,
    video: VideoNode,
    cropImage: CropImageNode,
    extractFrame: ExtractFrameNode,
    llm: LLMNode,
};
