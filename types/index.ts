// Common type definitions for the Cortex application

export interface Project {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Page {
  id: string;
  title: string;
  content: string;
  project_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  project_id: string;
  created_at?: string;
  metadata?: any;
}

export interface Container {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImageNode {
  id: string;
  url: string;
  filename: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  created_at?: string;
}

export interface TaskList {
  id: string;
  title: string;
  project_id: string;
  x: number;
  y: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  list_id: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Scratchpad {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  project_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatSource {
  content: string;
  metadata: {
    source: string;
    page?: string;
    score?: number;
  };
}

export interface ChatResponse {
  answer: string;
  widgets: {
    sources: ChatSource[];
  };
  warning?: string | null;
}

export interface ThemeColors {
  background: string;
  text: string;
  button: string;
  border: string;
  accent: string;
}

export interface Theme {
  light: ThemeColors;
  dark: ThemeColors;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeSize {
  width: number;
  height: number;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface CanvasState {
  zoom: number;
  position: NodePosition;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

// Store state types
export interface ProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  clearActiveProject: () => void;
}

export interface ThemeStore {
  isDarkMode: boolean;
  colors: Theme;
  toggleTheme: () => void;
}
