import { type WorkflowNode, type WorkflowEdge } from '@/types/workflow.types';

/**
 * Sample Product Listing Generator Workflow
 * 
 * Flow:
 * - 3 Image nodes → "Analyze product" LLM
 * - System prompt → "Analyze product" LLM
 * - Product specs → "Analyze product" LLM
 * - "Analyze product" output → 3 downstream LLM nodes (Amazon, Instagram, SEO)
 * - Each downstream LLM → Output Text node
 */
// export const productListingWorkflow = {
//     name: 'Product Listing Generator',
//     nodes: [
//         // ========== INPUT LAYER (Left Column) ==========
//         // System Prompt - Top left
//         {
//             id: 'system-prompt',
//             type: 'text',
//             position: { x: 50, y: 20 },
//             data: {
//                 text: 'You are a professional e-commerce copywriter and product analyst. Analyze product images and specs to create compelling, SEO-optimized content that drives conversions.',
//             },
//         },
//         // Product Specs - Below system prompt
//         {
//             id: 'product-specs',
//             type: 'text',
//             position: { x: 50, y: 220 },
//             data: {
//                 text: 'Product Name: Mini Projector\n\nKey Features:\n- 1080p Full HD\n- WiFi & Bluetooth\n- Portable design\n\nDimensions: 5.9 x 4.3 x 2.1 inches\nPrice: $89.99',
//             },
//         },
//         // Product Images - Spread vertically on left
//         {
//             id: 'img-1',
//             type: 'image',
//             position: { x: 50, y: 420 },
//             data: { images: [], currentIndex: 0, viewMode: 'single' },
//         },
//         {
//             id: 'img-2',
//             type: 'image',
//             position: { x: 50, y: 700 },
//             data: { images: [], currentIndex: 0, viewMode: 'single' },
//         },
//         {
//             id: 'img-3',
//             type: 'image',
//             position: { x: 50, y: 980 },
//             data: { images: [], currentIndex: 0, viewMode: 'single' },
//         },

//         // ========== ANALYZE LAYER (Center-Left) ==========
//         // Analyze Product LLM
//         {
//             id: 'llm-analyze',
//             type: 'llm',
//             position: { x: 600, y: 420 },
//             data: {
//                 model: 'gemini-2.5-flash',
//             },
//         },

//         // ========== CONTENT GENERATION PROMPTS (Center) ==========
//         // Amazon prompt - Top row
//         {
//             id: 'prompt-amazon',
//             type: 'text',
//             position: { x: 600, y: 20 },
//             data: {
//                 text: 'Based on the product analysis, write a compelling Amazon product listing with:\n- Attention-grabbing title (under 200 chars)\n- 5 bullet points highlighting key benefits\n- Detailed product description\n- Keywords for search optimization',
//             },
//         },
//         // Instagram prompt - Middle row
//         {
//             id: 'prompt-instagram',
//             type: 'text',
//             position: { x: 600, y: 700 },
//             data: {
//                 text: 'Create an engaging Instagram caption for this product that:\n- Hooks attention in the first line\n- Highlights 3 key benefits\n- Includes relevant emojis\n- Ends with a call-to-action\n- Suggests 10 relevant hashtags',
//             },
//         },
//         // SEO prompt - Bottom row
//         {
//             id: 'prompt-seo',
//             type: 'text',
//             position: { x: 600, y: 1000 },
//             data: {
//                 text: 'Write an SEO meta description (under 160 chars) that:\n- Includes primary keywords naturally\n- Has a compelling value proposition\n- Encourages click-through\nAlso provide a suggested meta title (under 60 chars).',
//             },
//         },

//         // ========== DOWNSTREAM LLMs (Center-Right) ==========
//         // Amazon LLM
//         {
//             id: 'llm-amazon',
//             type: 'llm',
//             position: { x: 1200, y: 80 },
//             data: {
//                 model: 'gemini-2.5-flash',
//             },
//         },
//         // Instagram LLM
//         {
//             id: 'llm-instagram',
//             type: 'llm',
//             position: { x: 1200, y: 450 },
//             data: {
//                 model: 'gemini-2.5-flash',
//             },
//         },
//         // SEO LLM
//         {
//             id: 'llm-seo',
//             type: 'llm',
//             position: { x: 1200, y: 820 },
//             data: {
//                 model: 'gemini-2.5-flash',
//             },
//         },

        
//     ] as WorkflowNode[],
//     edges: [
//         // ========== INPUTS TO ANALYZE LLM ==========
//         // Images to Analyze LLM
//         {
//             id: 'e-img1-analyze',
//             source: 'img-1',
//             sourceHandle: 'output',
//             target: 'llm-analyze',
//             targetHandle: 'images',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         {
//             id: 'e-img2-analyze',
//             source: 'img-2',
//             sourceHandle: 'output',
//             target: 'llm-analyze',
//             targetHandle: 'images',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         {
//             id: 'e-img3-analyze',
//             source: 'img-3',
//             sourceHandle: 'output',
//             target: 'llm-analyze',
//             targetHandle: 'images',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // System prompt to Analyze LLM
//         {
//             id: 'e-system-analyze',
//             source: 'system-prompt',
//             sourceHandle: 'output',
//             target: 'llm-analyze',
//             targetHandle: 'system_prompt',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // Product specs to Analyze LLM
//         {
//             id: 'e-specs-analyze',
//             source: 'product-specs',
//             sourceHandle: 'output',
//             target: 'llm-analyze',
//             targetHandle: 'user_message',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },

//         // ========== ANALYZE OUTPUT TO DOWNSTREAM LLMs ==========
//         // Analyze output → Amazon LLM (as system context)
//         {
//             id: 'e-analyze-amazon',
//             source: 'llm-analyze',
//             sourceHandle: 'output',
//             target: 'llm-amazon',
//             targetHandle: 'system_prompt',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // Analyze output → Instagram LLM (as system context)
//         {
//             id: 'e-analyze-instagram',
//             source: 'llm-analyze',
//             sourceHandle: 'output',
//             target: 'llm-instagram',
//             targetHandle: 'system_prompt',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // Analyze output → SEO LLM (as system context)
//         {
//             id: 'e-analyze-seo',
//             source: 'llm-analyze',
//             sourceHandle: 'output',
//             target: 'llm-seo',
//             targetHandle: 'system_prompt',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },

//         // ========== PROMPTS TO DOWNSTREAM LLMs ==========
//         // Amazon prompt to Amazon LLM
//         {
//             id: 'e-prompt-amazon',
//             source: 'prompt-amazon',
//             sourceHandle: 'output',
//             target: 'llm-amazon',
//             targetHandle: 'user_message',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // Instagram prompt to Instagram LLM
//         {
//             id: 'e-prompt-instagram',
//             source: 'prompt-instagram',
//             sourceHandle: 'output',
//             target: 'llm-instagram',
//             targetHandle: 'user_message',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // SEO prompt to SEO LLM
//         {
//             id: 'e-prompt-seo',
//             source: 'prompt-seo',
//             sourceHandle: 'output',
//             target: 'llm-seo',
//             targetHandle: 'user_message',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },

//         // ========== LLM OUTPUTS TO RESULT TEXT NODES ==========
//         // Amazon LLM output → Amazon Result Text
//         {
//             id: 'e-amazon-result',
//             source: 'llm-amazon',
//             sourceHandle: 'output',
//             target: 'result-amazon',
//             targetHandle: 'input',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // Instagram LLM output → Instagram Result Text
//         {
//             id: 'e-instagram-result',
//             source: 'llm-instagram',
//             sourceHandle: 'output',
//             target: 'result-instagram',
//             targetHandle: 'input',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//         // SEO LLM output → SEO Result Text
//         {
//             id: 'e-seo-result',
//             source: 'llm-seo',
//             sourceHandle: 'output',
//             target: 'result-seo',
//             targetHandle: 'input',
//             type: 'custom',
//             style: { stroke: '#8B5CF6', strokeWidth: 2 },
//         },
//     ] as WorkflowEdge[],
// };

// /**
//  * Simple demo workflow for testing
//  */
export const simpleTestWorkflow = {
    name: ' LLM Test',
    nodes: [
        {
            id: 'text-1',
            type: 'text',
            position: { x: 100, y: 100 },
            data: {
                text: 'You are a helpful AI assistant that can answer questions and help with tasks.',
            },
        },
        {
            id: 'text-2',
            type: 'text',
            position: { x: 100, y: 300 },
            data: {
                text: 'Explain the concept of a workflow and how it can be used to automate tasks.',
            },
        },
        {
            id: 'llm-1',
            type: 'llm',
            position: { x: 550, y: 150 },
            data: {
                model: 'gemini-2.5-flash',
            },
        },
    ] as WorkflowNode[],
    edges: [
        {
            id: 'e-text1-llm',
            source: 'text-1',
            sourceHandle: 'output',
            target: 'llm-1',
            targetHandle: 'system_prompt',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },
        {
            id: 'e-text2-llm',
            source: 'text-2',
            sourceHandle: 'output',
            target: 'llm-1',
            targetHandle: 'user_message',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },
        {
            id: 'e-llm-result',
            source: 'llm-1',
            sourceHandle: 'output',
            target: 'text3',
            targetHandle: 'input',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },
    ] as WorkflowEdge[],
};

/**
 * Product Marketing Kit Generator Workflow
 * 
 * Demonstrates ALL 6 node types with parallel execution and convergence:
 * 
 * Branch A (Image Processing + Product Description):
 * - Upload Image → Crop Image → LLM Node #1
 * - Text (System Prompt) → LLM Node #1
 * - Text (Product Details) → LLM Node #1
 * 
 * Branch B (Video Frame Extraction):
 * - Upload Video → Extract Frame
 * 
 * Convergence Point:
 * - LLM Node #1 output + Both images (cropped + video frame) → LLM Node #2 (final marketing post)
 * 
 * Execution Timeline:
 * - Phase 1: Upload nodes + Text nodes (parallel)
 * - Phase 2: Crop Image + Extract Frame (parallel)
 * - Phase 3: LLM Node #1 (waits for crop + texts)
 * - Phase 4: LLM Node #2 (waits for LLM #1 + video frame)
 */
export const marketingKitWorkflow = {
    name: 'Marketing Kit Generator',
    nodes: [
        // ========== BRANCH A: IMAGE PROCESSING + PRODUCT DESCRIPTION ==========

        // Upload Image Node (Phase 1)
        {
            id: 'upload-image',
            type: 'image',
            position: { x: 326.6, y: 221.8 },
            data: {
                images: [],
                currentIndex: 0,
                viewMode: 'single',
                label: 'Product Photo',
            },
        },

        // Crop Image Node (Phase 2) - crops product photo
        {
            id: 'crop-image',
            type: 'cropImage',
            position: { x: 779.1, y: 125.0 },
            data: {
                cropX: 10,
                cropY: 10,
                cropWidth: 41,
                cropHeight: 80,
                aspectRatio: '1:1',
                label: 'Crop Product',
            },
        },

        // Text Node #1: System Prompt for LLM #1
        {
            id: 'system-prompt-1',
            type: 'text',
            position: { x: 1196.8, y: -7.8 },
            data: {
                text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description based on the product image and details provided.',
                label: 'System Prompt',
            },
        },

        // Text Node #2: Product Details
        {
            id: 'product-details',
            type: 'text',
            position: { x: 1203.8, y: 225.5 },
            data: {
                text: 'Product: Wireless \nBluetooth Headphones Features : \nNoise cancellation, 30hr battery, \nfoldable design',
            },
        },

        // LLM Node #1: Generate Product Description (Phase 3)
        {
            id: 'llm-description',
            type: 'llm',
            position: { x: 1709.7, y: 195.2 },
            data: {
                model: 'gemini-2.5-flash',
                label: 'Generate Description',
            },
        },

        // ========== BRANCH B: VIDEO FRAME EXTRACTION ==========

        // Upload Video Node (Phase 1)
        {
            id: 'upload-video',
            type: 'video',
            position: { x: 686.4, y: 919.8 },
            data: {
                label: 'Product Demo Video',
            },
        },

        // Extract Frame Node (Phase 2)
        {
            id: 'extract-frame',
            type: 'extractFrame',
            position: { x: 1175.5, y: 703.3 },
            data: {
                timestamp: 0,
                label: 'Extract Frame (50%)',
            },
        },

        // ========== CONVERGENCE POINT ==========

        // Text Node #3: System Prompt for Final LLM
        {
            id: 'system-prompt-2',
            type: 'text',
            position: { x: 1730.4, y: 740.1 },
            data: {
                text: 'You are a social media manager. Create a tweet-length marketing post (under 280 characters) based on the product description and images. Make it engaging and include relevant hashtags.',
                label: 'Social Media Prompt',
            },
        },

        // LLM Node #2: Final Marketing Summary (Phase 4 - Convergence)
        {
            id: 'llm-final',
            type: 'llm',
            position: { x: 2254.6, y: 512.5 },
            data: {
                model: 'gemini-2.5-flash',
                label: 'Final Marketing Post',
            },
        },
    ] as WorkflowNode[],
    edges: [
        // ========== BRANCH A CONNECTIONS ==========

        // Upload Image → Crop Image
        {
            id: 'e-upload-crop',
            source: 'upload-image',
            sourceHandle: 'output',
            target: 'crop-image',
            targetHandle: 'image_input',
            type: 'custom',
            style: { stroke: '#06B6D4', strokeWidth: 2 }, // Cyan for image flow
        },

        // Crop Image → LLM #1 (images)
        {
            id: 'e-crop-llm1',
            source: 'crop-image',
            sourceHandle: 'output',
            target: 'llm-description',
            targetHandle: 'images',
            type: 'custom',
            style: { stroke: '#06B6D4', strokeWidth: 2 },
        },

        // System Prompt #1 → LLM #1
        {
            id: 'e-system1-llm1',
            source: 'system-prompt-1',
            sourceHandle: 'output',
            target: 'llm-description',
            targetHandle: 'system_prompt',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 }, // Purple for text flow
        },

        // Product Details → LLM #1
        {
            id: 'e-details-llm1',
            source: 'product-details',
            sourceHandle: 'output',
            target: 'llm-description',
            targetHandle: 'user_message',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },

        // ========== BRANCH B CONNECTIONS ==========

        // Upload Video → Extract Frame
        {
            id: 'e-video-frame',
            source: 'upload-video',
            sourceHandle: 'output',
            target: 'extract-frame',
            targetHandle: 'video_input',
            type: 'custom',
            style: { stroke: '#F59E0B', strokeWidth: 2 }, // Amber for video flow
        },

        // ========== CONVERGENCE CONNECTIONS ==========

        // LLM #1 output → LLM #2 user_message (product description as the message)
        {
            id: 'e-llm1-llm2',
            source: 'llm-description',
            sourceHandle: 'output',
            target: 'llm-final',
            targetHandle: 'user_message',
            type: 'custom',
            style: { stroke: '#10B981', strokeWidth: 2 }, // Green for LLM output flow
        },

        // Text #3 (Social Media Prompt) → LLM #2 system_prompt
        {
            id: 'e-system2-llm2',
            source: 'system-prompt-2',
            sourceHandle: 'output',
            target: 'llm-final',
            targetHandle: 'system_prompt',
            type: 'custom',
            style: { stroke: '#8B5CF6', strokeWidth: 2 },
        },

        // Crop Image → LLM #2 (images - product photo)
        {
            id: 'e-crop-llm2',
            source: 'crop-image',
            sourceHandle: 'output',
            target: 'llm-final',
            targetHandle: 'images',
            type: 'custom',
            style: { stroke: '#06B6D4', strokeWidth: 2 },
        },

        // Extract Frame → LLM #2 (images - video frame)
        {
            id: 'e-frame-llm2',
            source: 'extract-frame',
            sourceHandle: 'output',
            target: 'llm-final',
            targetHandle: 'images',
            type: 'custom',
            style: { stroke: '#F59E0B', strokeWidth: 2 },
        },
    ] as WorkflowEdge[],
};

