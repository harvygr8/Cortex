import { create } from 'zustand';

export type EdgeType = 'default' | 'smoothstep' | 'straight' | 'step';
export type EdgeColor = {
  light: string;
  dark: string;
};

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
  
  // Ollama settings
  ollamaSettings: OllamaSettings;

  // Update methods
  setEdgeType: (type: EdgeType) => void;
  setEdgeColor: (color: EdgeColor) => void;
  setEdgeWidth: (width: number) => void;
  setEdgeAnimated: (animated: boolean) => void;
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

