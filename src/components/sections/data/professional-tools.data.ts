import type { ChipPosition } from '../types';

/**
 * Pre-defined positions for tool chips in the Professional Tools section
 */
export const CHIP_POSITIONS: ChipPosition[] = [
    { toolId: 'crop', top: '18%', left: '5%' },
    { toolId: 'inpaint', top: '46%', left: '3%' },
    { toolId: 'outpaint', top: '33%', left: '15%' },
    { toolId: 'upscale', top: '65%', left: '10%' },
    { toolId: 'mask', top: '55%', left: '18%' },

    { toolId: 'painter', top: '15%', right: '5%' },
    { toolId: 'invert', top: '25%', right: '20%' },
    { toolId: 'channels', top: '35%', right: '5%' },
    { toolId: 'describer', top: '48%', right: '18%' },
    { toolId: 'relight', top: '55%', right: '3%' },
    { toolId: 'zdepth', top: '68%', right: '15%' },
];
