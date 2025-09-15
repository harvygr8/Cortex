// Common type definitions for the Cortex application

export interface Project {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  pages?: Page[];
  position_x?: number;
  position_y?: number;
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
  text: string;
  completed: boolean;
  task_list_id: string;
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
  background2: string;
  text: string;
  secondary: string;
  button: string;
  border: string;
  hover: string;
  accent: string;
  input: string;
  sidebar: string;
  sidebarIcon: string;
  sidebarLogo: string;
  navbar: string;
  warning: string;
  danger: string;
  chatBubble: {
    user: string;
    ai: string;
  };
  statusIndicator: string;
  statusText: string;
  focusRing: string;
  modal: {
    background: string;
    text: string;
  };
  overlay: string;
  dangerHover: string;
  font: {
    primary: string;
    heading: string;
    body: string;
    label: string;
  };
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
  fonts: ThemeColors['font'];
  toggleTheme: () => void;
}

// Next.js API Route parameter types
export interface APIRouteParams {
  params: {
    projectId?: string;
    pageId?: string;
    messageId?: string;
    containerId?: string;
    imageId?: string;
    listId?: string;
    taskId?: string;
    scratchpadId?: string;
  };
}

// Canvas state interfaces
export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasZoom {
  zoom: number;
}

export interface CanvasStateData extends CanvasZoom {
  position: CanvasPosition;
}

// Component prop interfaces
export interface NodeComponentProps {
  data: any;
  isConnectable?: boolean;
  selected?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// React component prop types
export interface ReactChildrenProps {
  children: React.ReactNode;
}

// Search and retrieval types
export interface SearchResult {
  pageContent: string;
  metadata: {
    projectId: string;
    pageId: string;
    pageTitle: string;
    sqlitePageId?: string;
    score?: number;
    source?: string;
  };
  fullContent?: string;
  source?: string;
}

export interface VectorDocument {
  pageContent: string;
  metadata: {
    projectId: string;
    projectTitle?: string;
    pageId: string;
    pageTitle: string;
    sqlitePageId?: string;
    sqliteProjectId?: string;
    hasFullContent?: boolean;
    contentLength?: number;
    [key: string]: any;
  };
}

export interface DocumentWithContent extends SearchResult {
  hasFullContent: boolean;
  originalContent: string;
}

export interface HybridSearchResult {
  pageContent: string;
  metadata: {
    projectId: string;
    pageId: string;
    pageTitle: string;
    sqlitePageId?: string;
    score?: number;
    source?: string;
  };
  fullContent?: string;
  hybridScore: number;
  source: 'semantic' | 'keyword' | 'hybrid';
  semanticRank?: number;
  keywordRank?: number;
  semanticScore?: number;
  bm25Score?: number;
  normalizedBM25?: number;
}

export interface SearchWeights {
  semantic: number;
  keyword: number;
}

export interface BM25Document extends SearchResult {
  score?: number;
}

// Database utility types
export interface PageOrder {
  id: string;
  order_index: number;
}

export interface TaskUpdates {
  text?: string;
  completed?: boolean;
  order_index?: number;
}

// Component-specific types for ProjectCanvasNew
export interface ChatCard {
  id: string;
  projectId: string;
  query: string;
  response: string;
  sources?: any[];
  created_at?: string;
  position_x?: number;
  position_y?: number;
  source_handle?: string | null;
  target_handle?: string | null;
}

export interface TasksCard {
  id: string;
  projectId: string;
  title: string;
  tasks: Task[];
  created_at?: string;
  position_x?: number;
  position_y?: number;
  source_handle?: string | null;
  target_handle?: string | null;
}

export interface ScratchpadCard {
  id: string;
  projectId: string;
  text: string;
  created_at?: string;
  position_x?: number;
  position_y?: number;
  source_handle?: string | null;
  target_handle?: string | null;
}

export interface ImageCard {
  id: string;
  projectId: string;
  imageUrl: string;
  imageAlt: string;
  created_at?: string;
  position_x?: number;
  position_y?: number;
  source_handle?: string | null;
  target_handle?: string | null;
}

export interface ContainerCard {
  id: string;
  projectId: string;
  label: string;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  created_at?: string;
}

export interface PageData {
  projectId: string;
  title: string;
  content: string;
}

export interface PageWithProject extends Page {
  projectId: string;
}

// Context menu state types
export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  project?: Project;
  initialQuery?: string;
  position?: { x: number; y: number };
}

export interface PageModalState {
  isOpen: boolean;
  pageId?: string;
  projectId?: string;
}

export interface ChatContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  chatCard?: ChatCard;
}

export interface TasksContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  tasksCard?: TasksCard;
}

export interface ScratchpadContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  scratchpadCard?: ScratchpadCard;
}

export interface ImageContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  imageCard?: ImageCard;
}
