import { create } from 'zustand';

export type EdgeType = 'default' | 'smoothstep' | 'straight' | 'step';
export type EdgeColor = {
  light: string;
  dark: string;
};

export type CanvasBackgroundVariant = 'dots' | 'lines' | 'cross';

export interface OllamaSettings {
  baseUrl: string;
  model: string;
  temperature: number;
}

interface SettingsStore {
  // Edge settings
  edgeType: EdgeType;
  edgeColor: EdgeColor;
  edgeWidth: number;
  edgeAnimated: boolean;
  
  // Canvas settings
  canvasBackground: CanvasBackgroundVariant | 'none';
  canvasSnapToGrid: boolean;
  canvasGridSize: number;
  canvasMiniMap: boolean;
  canvasControls: boolean;
  
  // Ollama settings
  ollamaSettings: OllamaSettings;

  // Update methods
  setEdgeType: (type: EdgeType) => void;
  setEdgeColor: (color: EdgeColor) => void;
  setEdgeWidth: (width: number) => void;
  setEdgeAnimated: (animated: boolean) => void;
  
  setCanvasBackground: (variant: CanvasBackgroundVariant | 'none') => void;
  setCanvasSnapToGrid: (snap: boolean) => void;
  setCanvasGridSize: (size: number) => void;
  setCanvasMiniMap: (show: boolean) => void;
  setCanvasControls: (show: boolean) => void;

  setOllamaSettings: (settings: Partial<OllamaSettings>) => void;
  
  // Initialize settings from localStorage
  initializeSettings: () => void;
}

const defaultEdgeColor: EdgeColor = {
  light: '#4b5563', // gray-600
  dark: '#6b7280',  // gray-500
};

const defaultOllamaSettings: OllamaSettings = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2',
  temperature: 0.7,
};

const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Default values
  edgeType: 'default',
  edgeColor: defaultEdgeColor,
  edgeWidth: 2,
  edgeAnimated: true,
  
  canvasBackground: 'dots',
  canvasSnapToGrid: true,
  canvasGridSize: 20,
  canvasMiniMap: true,
  canvasControls: true,

  ollamaSettings: defaultOllamaSettings,
  
  // Update methods
  setEdgeType: (type: EdgeType) => {
    set({ edgeType: type });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-edge-type', type);
    }
  },
  setEdgeColor: (color: EdgeColor) => {
    set({ edgeColor: color });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-edge-color', JSON.stringify(color));
    }
  },
  setEdgeWidth: (width: number) => {
    set({ edgeWidth: width });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-edge-width', width.toString());
    }
  },
  setEdgeAnimated: (animated: boolean) => {
    set({ edgeAnimated: animated });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-edge-animated', animated.toString());
    }
  },

  setCanvasBackground: (variant: CanvasBackgroundVariant | 'none') => {
    set({ canvasBackground: variant });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-canvas-background', variant);
    }
  },
  setCanvasSnapToGrid: (snap: boolean) => {
    set({ canvasSnapToGrid: snap });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-canvas-snap', snap.toString());
    }
  },
  setCanvasGridSize: (size: number) => {
    set({ canvasGridSize: size });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-canvas-grid-size', size.toString());
    }
  },
  setCanvasMiniMap: (show: boolean) => {
    set({ canvasMiniMap: show });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-canvas-minimap', show.toString());
    }
  },
  setCanvasControls: (show: boolean) => {
    set({ canvasControls: show });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-canvas-controls', show.toString());
    }
  },

  setOllamaSettings: (settings: Partial<OllamaSettings>) => {
    const current = get().ollamaSettings;
    const newSettings = { ...current, ...settings };
    set({ ollamaSettings: newSettings });
    if (typeof window !== 'undefined') {
      localStorage.setItem('cortex-ollama-settings', JSON.stringify(newSettings));
    }
  },
  
  // Initialize settings from localStorage
  initializeSettings: () => {
    if (typeof window === 'undefined') return;
    
    const savedEdgeType = localStorage.getItem('cortex-edge-type') as EdgeType;
    const savedEdgeColor = localStorage.getItem('cortex-edge-color');
    const savedEdgeWidth = localStorage.getItem('cortex-edge-width');
    const savedEdgeAnimated = localStorage.getItem('cortex-edge-animated');
    
    const savedCanvasBackground = localStorage.getItem('cortex-canvas-background') as CanvasBackgroundVariant | 'none';
    const savedCanvasSnap = localStorage.getItem('cortex-canvas-snap');
    const savedCanvasGridSize = localStorage.getItem('cortex-canvas-grid-size');
    const savedCanvasMiniMap = localStorage.getItem('cortex-canvas-minimap');
    const savedCanvasControls = localStorage.getItem('cortex-canvas-controls');

    const savedOllamaSettings = localStorage.getItem('cortex-ollama-settings');
    
    const updates: Partial<SettingsStore> = {};
    
    if (savedEdgeType && ['default', 'smoothstep', 'straight', 'step'].includes(savedEdgeType)) {
      updates.edgeType = savedEdgeType;
    }
    
    if (savedEdgeColor) {
      try {
        updates.edgeColor = JSON.parse(savedEdgeColor);
      } catch (e) {
        console.error('Error parsing edge color from localStorage:', e);
      }
    }
    
    if (savedEdgeWidth) {
      const width = parseInt(savedEdgeWidth, 10);
      if (!isNaN(width) && width > 0) {
        updates.edgeWidth = width;
      }
    }
    
    if (savedEdgeAnimated !== null) {
      updates.edgeAnimated = savedEdgeAnimated === 'true';
    }

    if (savedCanvasBackground && ['dots', 'lines', 'cross', 'none'].includes(savedCanvasBackground)) {
      updates.canvasBackground = savedCanvasBackground;
    }
    if (savedCanvasSnap !== null) updates.canvasSnapToGrid = savedCanvasSnap === 'true';
    if (savedCanvasGridSize) {
      const size = parseInt(savedCanvasGridSize, 10);
      if (!isNaN(size) && size > 0) updates.canvasGridSize = size;
    }
    if (savedCanvasMiniMap !== null) updates.canvasMiniMap = savedCanvasMiniMap === 'true';
    if (savedCanvasControls !== null) updates.canvasControls = savedCanvasControls === 'true';

    if (savedOllamaSettings) {
      try {
        updates.ollamaSettings = { ...defaultOllamaSettings, ...JSON.parse(savedOllamaSettings) };
      } catch (e) {
        console.error('Error parsing ollama settings from localStorage:', e);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },
}));

export default useSettingsStore;
