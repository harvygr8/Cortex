import { create } from 'zustand';

export type EdgeType = 'default' | 'smoothstep' | 'straight' | 'step';
export type EdgeColor = {
  light: string;
  dark: string;
};

interface SettingsStore {
  // Edge settings
  edgeType: EdgeType;
  edgeColor: EdgeColor;
  edgeWidth: number;
  edgeAnimated: boolean;
  
  // Update methods
  setEdgeType: (type: EdgeType) => void;
  setEdgeColor: (color: EdgeColor) => void;
  setEdgeWidth: (width: number) => void;
  setEdgeAnimated: (animated: boolean) => void;
  
  // Initialize settings from localStorage
  initializeSettings: () => void;
}

const defaultEdgeColor: EdgeColor = {
  light: '#4b5563', // gray-600
  dark: '#6b7280',  // gray-500
};

const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Default values
  edgeType: 'default',
  edgeColor: defaultEdgeColor,
  edgeWidth: 2,
  edgeAnimated: true,
  
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
  
  // Initialize settings from localStorage
  initializeSettings: () => {
    if (typeof window === 'undefined') return;
    
    const savedEdgeType = localStorage.getItem('cortex-edge-type') as EdgeType;
    const savedEdgeColor = localStorage.getItem('cortex-edge-color');
    const savedEdgeWidth = localStorage.getItem('cortex-edge-width');
    const savedEdgeAnimated = localStorage.getItem('cortex-edge-animated');
    
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
    
    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },
}));

export default useSettingsStore;

