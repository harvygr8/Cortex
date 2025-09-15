'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'react-hot-toast';
import { Container } from 'lucide-react';
import useThemeStore from '../../lib/stores/themeStore';
import ContextMenu from './ContextMenu';
import ChatContextMenu from './ChatContextMenu';
import TasksContextMenu from './TasksContextMenu';
import ChatModal from './ChatModal';
import AddPageModal from './AddPageModal';
import PageModal from './PageModal';
import ProjectNode from './ProjectNode';
import ChatNode from './ChatNode';
import TasksNode from './TasksNode';
import ScratchpadNode from './ScratchpadNode';
import ImageNode from './ImageNode';
import ContainerNode from './ContainerNode';

// Default card and grid settings
const DEFAULT_CARD_WIDTH = 420;
const DEFAULT_CARD_HEIGHT = 320;
const GRID_COLUMNS = 3;
const GRID_H_GAP = 100;
const GRID_V_GAP = 100;

// Custom node types for React Flow
const nodeTypes = {
  projectNode: ProjectNode,
  chatNode: ChatNode,
  tasksNode: TasksNode,
  scratchpadNode: ScratchpadNode,
  imageNode: ImageNode,
  containerNode: ContainerNode,
};

// React Flow wrapper component
function ProjectCanvasFlow({ projects }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  // Detect OS for pan key (Cmd on Mac, Ctrl on Windows/Linux)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const panKey = isMac ? 'Meta' : 'Control';
  
  // React Flow state
  const [nodes, setNodes, reactFlowOnNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  
  // App state
  const [projectPages, setProjectPages] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [chatContextMenu, setChatContextMenu] = useState(null);
  const [tasksContextMenu, setTasksContextMenu] = useState(null);
  const [scratchpadContextMenu, setScratchpadContextMenu] = useState(null);
  const [imageContextMenu, setImageContextMenu] = useState(null);
  const [paneContextMenu, setPaneContextMenu] = useState(null);
  const [chatModal, setChatModal] = useState(null);
  const [addPageModal, setAddPageModal] = useState(null);
  const [pageModal, setPageModal] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [containerNodeMap, setContainerNodeMap] = useState(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Track positions for debounced saving
  const savePositionsTimeoutRef = useRef(null);
  const lastNodesRef = useRef([]);

  // Function to save multiple node positions
  const saveNodePositions = useCallback(async (nodesToSave) => {
    const savePromises = [];
    
    for (const node of nodesToSave) {
      const x = Number(node.position.x);
      const y = Number(node.position.y);
      
      if (isNaN(x) || isNaN(y)) continue;
      
      if (node.type === 'projectNode' && node.data.project) {
        savePromises.push(
          fetch(`/api/projects/${node.data.project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          }).catch(error => console.error(`Error saving project position for ${node.id}:`, error))
        );
      } else if (node.type === 'chatNode' && node.data.chatCard) {
        savePromises.push(
          fetch(`/api/projects/${node.data.chatCard.projectId}/chat-messages/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          }).catch(error => console.error(`Error saving chat position for ${node.id}:`, error))
        );
        } else if (node.type === 'tasksNode' && node.data.tasksCard) {
        savePromises.push(
          fetch(`/api/projects/${node.data.tasksCard.projectId}/task-lists/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          }).catch(error => console.error(`Error saving task position for ${node.id}:`, error))
        );
      } else if (node.type === 'scratchpadNode' && node.data.scratchpadCard) {
        savePromises.push(
          fetch(`/api/projects/${node.data.scratchpadCard.projectId}/scratchpads/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          }).catch(error => console.error(`Error saving scratchpad position for ${node.id}:`, error))
        );
      } else if (node.type === 'imageNode' && node.data.imageCard) {
        savePromises.push(
          fetch(`/api/projects/${node.data.imageCard.projectId}/images/${node.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionX: x, positionY: y }),
          }).catch(error => console.error(`Error saving image position for ${node.id}:`, error))
        );
      }
    }
    
    if (savePromises.length > 0) {
      console.log(`[ProjectCanvas] Saving positions for ${savePromises.length} nodes`);
      await Promise.all(savePromises);
      console.log(`[ProjectCanvas] Successfully saved ${savePromises.length} node positions`);
    }
  }, []);

  // Custom onNodesChange handler with debounced position saving
  const onNodesChange = useCallback((changes) => {
    reactFlowOnNodesChange(changes);
    
    // Check if any changes involve position updates
    const hasPositionChanges = changes.some(change => 
      change.type === 'position' && change.position
    );
    
    if (hasPositionChanges) {
      // Clear existing timeout
      if (savePositionsTimeoutRef.current) {
        clearTimeout(savePositionsTimeoutRef.current);
      }
      
      // Set new timeout to save positions after drag ends
      savePositionsTimeoutRef.current = setTimeout(() => {
        // Get current nodes and find which ones have moved
        setNodes(currentNodes => {
          const movedNodes = [];
          
          for (const currentNode of currentNodes) {
            const lastNode = lastNodesRef.current.find(n => n.id === currentNode.id);
            if (lastNode) {
              const moved = Math.abs(currentNode.position.x - lastNode.position.x) > 1 || 
                           Math.abs(currentNode.position.y - lastNode.position.y) > 1;
              if (moved) {
                movedNodes.push(currentNode);
              }
            }
          }
          
          // Save positions for moved nodes
          if (movedNodes.length > 0) {
            saveNodePositions(movedNodes);
          }
          
          // Update last nodes reference
          lastNodesRef.current = [...currentNodes];
          
          return currentNodes;
        });
      }, 500); // 500ms debounce
    }
  }, [reactFlowOnNodesChange, saveNodePositions]);

  // Context menu handlers - define early to avoid hoisting issues
  const handleContextMenu = useCallback((e, project) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project: project
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleClosePaneContextMenu = useCallback(() => {
    setPaneContextMenu(null);
  }, []);

  // Pane context menu handler (right-click on empty canvas)
  const handlePaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const flowPosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setPaneContextMenu({
      x: event.clientX,
      y: event.clientY,
      position: flowPosition
    });
  }, [screenToFlowPosition]);

  // Chat context menu handlers
  const handleChatContextMenu = useCallback((e, chatCard) => {
    console.log('handleChatContextMenu called', { e, chatCard });
    e.preventDefault();
    e.stopPropagation();
    
    setChatContextMenu({
      x: e.clientX,
      y: e.clientY,
      chatCard: chatCard
    });
  }, []);

  const handleCloseChatContextMenu = useCallback(() => {
    setChatContextMenu(null);
  }, []);

  // Tasks context menu handlers
  const handleTasksContextMenu = useCallback((e, tasksCard) => {
    console.log('handleTasksContextMenu called', { e, tasksCard });
    e.preventDefault();
    e.stopPropagation();
    
    setTasksContextMenu({
      x: e.clientX,
      y: e.clientY,
      tasksCard: tasksCard
    });
  }, []);

  const handleCloseTasksContextMenu = useCallback(() => {
    setTasksContextMenu(null);
  }, []);

  // Scratchpad context menu handlers
  const handleScratchpadContextMenu = useCallback((e, scratchpadCard) => {
    console.log('handleScratchpadContextMenu called', { e, scratchpadCard });
    e.preventDefault();
    e.stopPropagation();
    
    setScratchpadContextMenu({
      x: e.clientX,
      y: e.clientY,
      scratchpadCard: scratchpadCard
    });
  }, []);

  const handleCloseScratchpadContextMenu = useCallback(() => {
    setScratchpadContextMenu(null);
  }, []);

  // Image context menu handlers
  const handleImageContextMenu = useCallback((e, imageCard) => {
    console.log('handleImageContextMenu called', { e, imageCard });
    e.preventDefault();
    e.stopPropagation();
    
    setImageContextMenu({
      x: e.clientX,
      y: e.clientY,
      imageCard: imageCard
    });
  }, []);

  const handleCloseImageContextMenu = useCallback(() => {
    setImageContextMenu(null);
  }, []);

  const handleChatWithProject = useCallback((project) => {
    setChatModal({
      project: project,
      isOpen: true
    });
  }, []);

  const handleCloseChatModal = useCallback(() => {
    setChatModal(null);
  }, []);

  const handleAddPage = useCallback((project) => {
    setAddPageModal({
      project: project,
      isOpen: true
    });
  }, []);

  const handleCloseAddPageModal = useCallback(() => {
    setAddPageModal(null);
  }, []);

  const handleOpenPageModal = useCallback((pageId, projectId) => {
    setPageModal({
      pageId,
      projectId,
      isOpen: true
    });
  }, []);

  const handleClosePageModal = useCallback(() => {
    setPageModal(null);
  }, []);

  const handlePageClick = useCallback((pageId, action, project) => {
    if (action === 'view-page' && pageId) {
      handleOpenPageModal(pageId, project.id);
    } else if (action === 'add-page') {
      handleAddPage(project);
    } else if (action === 'view-all-pages') {
      // For now, this could open the project page or a dedicated pages modal
      // We'll keep the existing navigation for this case
      window.location.href = `/projects/${project.id}`;
    }
  }, [handleOpenPageModal, handleAddPage]);

  const handleCreatePage = useCallback(async (pageData) => {
    try {
      const response = await fetch(`/api/projects/${pageData.projectId}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pageData.title,
          content: pageData.content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create page');
      }

      const newPage = await response.json();
      
      // Refresh the project pages to include the new page
      const updatedPages = await fetch(`/api/projects/${pageData.projectId}/pages`);
      if (updatedPages.ok) {
        const pagesData = await updatedPages.json();
        setProjectPages(prev => ({
          ...prev,
          [pageData.projectId]: pagesData
        }));
      }
      
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }, [setProjectPages]);

  const handleImportData = useCallback((project) => {
    // Create a temporary file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.md,.markdown';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`/api/projects/${project.id}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        // Refresh project pages after successful upload
        const updatedPages = await fetch(`/api/projects/${project.id}/pages`);
        if (updatedPages.ok) {
          const pagesData = await updatedPages.json();
          setProjectPages(prev => ({
            ...prev,
            [project.id]: pagesData
          }));
        }

        console.log('File uploaded successfully');
        toast.success(`Document imported successfully to ${project.title}!`);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to import document. Please try again.');
      } finally {
        document.body.removeChild(fileInput);
      }
    };

    document.body.appendChild(fileInput);
    fileInput.click();
  }, [setProjectPages]);

  const handleRegenerateVectors = useCallback(async (project) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/regenerate-vectors`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Vector regeneration result:', data);
      console.log('Vectors regenerated successfully for project:', project.title);
      toast.success(`Vectors regenerated successfully for ${project.title}!`);
    } catch (error) {
      console.error('Error regenerating vectors:', error);
      toast.error('Failed to regenerate vectors. Please try again.');
    }
  }, []);

  const handleDeleteProject = useCallback(async (project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the project node from the canvas
        setNodes(prevNodes => prevNodes.filter(node => node.id !== `project-${project.id}`));
        
        // Remove any chat nodes connected to this project
        setEdges(prevEdges => {
          const connectedChatEdges = prevEdges.filter(edge => edge.source === `project-${project.id}`);
          const connectedChatNodeIds = connectedChatEdges.map(edge => edge.target);
          
          // Remove chat nodes
          setNodes(prevNodes => prevNodes.filter(node => !connectedChatNodeIds.includes(node.id)));
          
          // Remove all edges connected to this project and its chat nodes
          return prevEdges.filter(edge => 
            edge.source !== `project-${project.id}` && 
            !connectedChatNodeIds.includes(edge.source) &&
            !connectedChatNodeIds.includes(edge.target)
          );
        });
        
        console.log('Project deleted successfully');
        toast.success(`${project.title} deleted successfully!`);
      } else {
        console.error('Failed to delete project');
        toast.error('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    }
  }, [setNodes, setEdges]);

  // Chat context menu action handlers
  const handleCopyResponse = useCallback((chatCard) => {
    navigator.clipboard.writeText(chatCard.response).then(() => {
      toast.success('Response copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy response:', err);
      toast.error('Failed to copy response');
    });
  }, []);


  const handleExportToFile = useCallback((chatCard) => {
    const content = `# Chat Response\n\n## Query:\n${chatCard.query}\n\n## Response:\n${chatCard.response}\n\n---\nExported from Cortex on ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-response-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chat response exported to file!');
  }, []);

  // Tasks context menu action handlers
  const handleExportTasks = useCallback((tasksCard) => {
    const tasks = tasksCard.tasks || [];
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    
    const content = `# Task List\n\n## Summary\n- Total tasks: ${tasks.length}\n- Completed: ${completedTasks.length}\n- Pending: ${pendingTasks.length}\n- Progress: ${Math.round((completedTasks.length / tasks.length) * 100)}%\n\n## Completed Tasks\n${completedTasks.map(t => `- [x] ${t.text}`).join('\n')}\n\n## Pending Tasks\n${pendingTasks.map(t => `- [ ] ${t.text}`).join('\n')}\n\n---\nExported from Cortex on ${new Date().toLocaleDateString()}`;
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tasks exported to file!');
  }, []);

  // Detach node from project
  const handleDetachNode = useCallback((nodeId, nodeType) => {
    console.log(`[ProjectCanvas] Detaching ${nodeType} node ${nodeId} from project`);
    
    // Remove edges connected to this node
    setEdges(prevEdges => {
      const filteredEdges = prevEdges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      console.log(`[ProjectCanvas] Removed ${prevEdges.length - filteredEdges.length} edges for node ${nodeId}`);
      return filteredEdges;
    });
    
    const nodeTypeLabel = nodeType === 'chatNode' ? 'Q/A Node' : 
                         nodeType === 'tasksNode' ? 'Task Node' :
                         nodeType === 'scratchpadNode' ? 'Scratchpad Node' :
                         nodeType === 'imageNode' ? 'Image Node' : 'Node';
    toast.success(`${nodeTypeLabel} detached from project`);
  }, [setEdges]);

  // Delete chat node
  const deleteChatNode = useCallback(async (chatNodeId) => {
    // Get current nodes to find project info
    let projectId = null;
    setNodes(prev => {
      const chatNode = prev.find(node => node.id === chatNodeId);
      projectId = chatNode?.data?.chatCard?.projectId;
      return prev.filter(node => node.id !== chatNodeId);
    });
    
    setEdges(prev => prev.filter(edge => 
      edge.source !== chatNodeId && edge.target !== chatNodeId
    ));
    
    // Delete from database
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/chat-messages/${chatNodeId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting chat message from database:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Delete task node
  const deleteTaskNode = useCallback(async (taskNodeId) => {
    // Get current nodes to find project info
    let projectId = null;
    setNodes(prev => {
      const taskNode = prev.find(node => node.id === taskNodeId);
      projectId = taskNode?.data?.tasksCard?.projectId;
      return prev.filter(node => node.id !== taskNodeId);
    });
    
    setEdges(prev => prev.filter(edge => 
      edge.source !== taskNodeId && edge.target !== taskNodeId
    ));
    
    // Delete from database
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/task-lists/${taskNodeId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting task list from database:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Delete scratchpad node
  const deleteScratchpadNode = useCallback(async (scratchpadNodeId) => {
    // Get current nodes to find project info
    let projectId = null;
    setNodes(prev => {
      const scratchpadNode = prev.find(node => node.id === scratchpadNodeId);
      projectId = scratchpadNode?.data?.scratchpadCard?.projectId;
      return prev.filter(node => node.id !== scratchpadNodeId);
    });
    
    setEdges(prev => prev.filter(edge => 
      edge.source !== scratchpadNodeId && edge.target !== scratchpadNodeId
    ));
    
    // Delete from database
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/scratchpads/${scratchpadNodeId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting scratchpad from database:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Delete image node
  const deleteImageNode = useCallback(async (imageNodeId) => {
    // Get current nodes to find project info
    let projectId = null;
    setNodes(prev => {
      const imageNode = prev.find(node => node.id === imageNodeId);
      projectId = imageNode?.data?.imageCard?.projectId;
      return prev.filter(node => node.id !== imageNodeId);
    });
    
    setEdges(prev => prev.filter(edge => 
      edge.source !== imageNodeId && edge.target !== imageNodeId
    ));
    
    // Delete from database
    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/images/${imageNodeId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting image from database:', error);
      }
    }
  }, [setNodes, setEdges]);

  // Fetch pages for all projects - only once on mount or when projects change
  useEffect(() => {
    const fetchAllProjectPages = async () => {
      if (hasInitialized && Object.keys(projectPages).length > 0) return;
      
      const pagesData = {};
      
      await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(`/api/projects/${project.id}/pages`);
            if (response.ok) {
              const pages = await response.json();
              pagesData[project.id] = pages;
            } else {
              pagesData[project.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching pages for project ${project.id}:`, error);
            pagesData[project.id] = [];
          }
        })
      );
      
      setProjectPages(pagesData);
      setHasInitialized(true);
    };

    if (projects.length > 0) {
      fetchAllProjectPages();
    }
  }, [projects, hasInitialized, projectPages]);

  // Load persisted data including project positions from canvas state
  useEffect(() => {
    const loadPersistedData = async () => {
      if (!hasInitialized || projects.length === 0) {
        return;
      }
      
      console.log('[ProjectCanvas] Loading persisted data for', projects.length, 'projects');
      const chatNodes = [];
      const taskNodes = [];
      const scratchpadNodes = [];
      const imageNodes = [];
      const containerNodes = [];
      const projectNodes = [];
      const edges = [];
      
      // Projects already contain position data, no need to fetch separately
      
      for (const project of projects) {
        try {
          // Load chat messages
          const chatResponse = await fetch(`/api/projects/${project.id}/chat-messages`);
          if (chatResponse.ok) {
            const chatMessages = await chatResponse.json();
            
            chatMessages.forEach(message => {
              const chatNodeId = message.id;
              const chatNode = {
                id: chatNodeId,
                type: 'chatNode',
                position: { x: Number(message.position_x) || 0, y: Number(message.position_y) || 0 },
                data: {
                  chatCard: {
                    id: message.id,
                    query: message.query,
                    response: message.response,
                    sources: message.sources || [],
                    projectId: project.id
                  },
                  onDelete: deleteChatNode,
                  onContextMenu: handleChatContextMenu
                },
                style: { 
                  width: DEFAULT_CARD_WIDTH, 
                  height: DEFAULT_CARD_HEIGHT 
                }
              };
              chatNodes.push(chatNode);
              
              // Create edge to project using stored handle information
              const sourceNodeId = `project-${project.id}`;
              
              // Use stored handles if available, otherwise fall back to smart calculation
              let sourceHandle = message.source_handle;
              let targetHandle = message.target_handle;
              
              // If no handles stored, calculate them (fallback for old data)
              if (!sourceHandle || !targetHandle) {
                const projectNode = projects.find(p => p.id === project.id);
                const projectIndex = projects.findIndex(p => p.id === project.id);
                const row = Math.floor(projectIndex / GRID_COLUMNS);
                const col = projectIndex % GRID_COLUMNS;
                const projectPos = {
                  x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP),
                  y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP)
                };
                
                const chatPos = { x: Number(message.position_x) || 0, y: Number(message.position_y) || 0 };
                const deltaX = chatPos.x - projectPos.x;
                const deltaY = chatPos.y - projectPos.y;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  if (deltaX > 0) {
                    sourceHandle = 'project-output-right';
                    targetHandle = 'chat-input-left';
                  } else {
                    sourceHandle = 'project-output-left';
                    targetHandle = 'chat-input-right';
                  }
                } else {
                  if (deltaY > 0) {
                    sourceHandle = 'project-output-bottom';
                    targetHandle = 'chat-input-top';
                  } else {
                    sourceHandle = 'project-output-top';
                    targetHandle = 'chat-input-bottom';
                  }
                }
              }
              
              const edge = {
                id: `edge-${sourceNodeId}-${chatNodeId}`,
                source: sourceNodeId,
                target: chatNodeId,
                sourceHandle,
                targetHandle,
                type: 'smoothstep',
                style: { 
                  stroke: isDarkMode ? '#3b82f6' : '#2563eb',
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                },
                animated: true
              };
              edges.push(edge);
            });
          }
          
          // Load task lists
          const taskResponse = await fetch(`/api/projects/${project.id}/task-lists`);
          if (taskResponse.ok) {
            const taskLists = await taskResponse.json();
            
            taskLists.forEach(taskList => {
              const taskNodeId = taskList.id;
              const taskNode = {
                id: taskNodeId,
                type: 'tasksNode',
                position: { x: Number(taskList.position_x) || 0, y: Number(taskList.position_y) || 0 },
                data: {
                  tasksCard: {
                    id: taskList.id,
                    tasks: taskList.tasks || [],
                    projectId: project.id
                  },
                  onDelete: deleteTaskNode,
                  onContextMenu: handleTasksContextMenu
                },
                style: { 
                  width: DEFAULT_CARD_WIDTH, 
                  height: DEFAULT_CARD_HEIGHT 
                }
              };
              taskNodes.push(taskNode);
              
              // Create edge to project using stored handle information
              const sourceNodeId = `project-${project.id}`;
              
              // Use stored handles if available, otherwise fall back to smart calculation
              let sourceHandle = taskList.source_handle;
              let targetHandle = taskList.target_handle;
              
              // If no handles stored, calculate them (fallback for old data)
              if (!sourceHandle || !targetHandle) {
                const projectNode = projects.find(p => p.id === project.id);
                const projectIndex = projects.findIndex(p => p.id === project.id);
                const row = Math.floor(projectIndex / GRID_COLUMNS);
                const col = projectIndex % GRID_COLUMNS;
                const projectPos = {
                  x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP),
                  y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP)
                };
                
                const taskPos = { x: Number(taskList.position_x) || 0, y: Number(taskList.position_y) || 0 };
                const deltaX = taskPos.x - projectPos.x;
                const deltaY = taskPos.y - projectPos.y;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  if (deltaX > 0) {
                    sourceHandle = 'project-output-right';
                    targetHandle = 'tasks-input-left';
                  } else {
                    sourceHandle = 'project-output-left';
                    targetHandle = 'tasks-input-right';
                  }
                } else {
                  if (deltaY > 0) {
                    sourceHandle = 'project-output-bottom';
                    targetHandle = 'tasks-input-top';
                  } else {
                    sourceHandle = 'project-output-top';
                    targetHandle = 'tasks-input-bottom';
                  }
                }
              }
              
              const edge = {
                id: `edge-${sourceNodeId}-${taskNodeId}`,
                source: sourceNodeId,
                target: taskNodeId,
                sourceHandle,
                targetHandle,
                type: 'smoothstep',
                style: { 
                  stroke: isDarkMode ? '#3b82f6' : '#2563eb',
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                },
                animated: true
              };
              edges.push(edge);
            });
          }
          
          // Load scratchpads
          const scratchpadResponse = await fetch(`/api/projects/${project.id}/scratchpads`);
          if (scratchpadResponse.ok) {
            const scratchpads = await scratchpadResponse.json();
            
            scratchpads.forEach(scratchpad => {
              const scratchpadNodeId = scratchpad.id;
              const scratchpadNode = {
                id: scratchpadNodeId,
                type: 'scratchpadNode',
                position: { x: Number(scratchpad.position_x) || 0, y: Number(scratchpad.position_y) || 0 },
                data: {
                  scratchpadCard: {
                    id: scratchpad.id,
                    text: scratchpad.text || '',
                    projectId: project.id
                  },
                  onDelete: deleteScratchpadNode,
                  onContextMenu: handleScratchpadContextMenu
                },
                style: { 
                  width: DEFAULT_CARD_WIDTH, 
                  height: DEFAULT_CARD_HEIGHT 
                }
              };
              scratchpadNodes.push(scratchpadNode);
              
              // Create edge to project using stored handle information
              const sourceNodeId = `project-${project.id}`;
              
              // Use stored handles if available, otherwise fall back to smart calculation
              let sourceHandle = scratchpad.source_handle;
              let targetHandle = scratchpad.target_handle;
              
              // If no handles stored, calculate them (fallback for old data)
              if (!sourceHandle || !targetHandle) {
                const projectNode = projects.find(p => p.id === project.id);
                const projectIndex = projects.findIndex(p => p.id === project.id);
                const row = Math.floor(projectIndex / GRID_COLUMNS);
                const col = projectIndex % GRID_COLUMNS;
                const projectPos = {
                  x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP),
                  y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP)
                };
                
                const scratchpadPos = { x: Number(scratchpad.position_x) || 0, y: Number(scratchpad.position_y) || 0 };
                const deltaX = scratchpadPos.x - projectPos.x;
                const deltaY = scratchpadPos.y - projectPos.y;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  if (deltaX > 0) {
                    sourceHandle = 'project-output-right';
                    targetHandle = 'scratchpad-input-left';
                  } else {
                    sourceHandle = 'project-output-left';
                    targetHandle = 'scratchpad-input-right';
                  }
                } else {
                  if (deltaY > 0) {
                    sourceHandle = 'project-output-bottom';
                    targetHandle = 'scratchpad-input-top';
                  } else {
                    sourceHandle = 'project-output-top';
                    targetHandle = 'scratchpad-input-bottom';
                  }
                }
              }
              
              const edge = {
                id: `edge-${sourceNodeId}-${scratchpadNodeId}`,
                source: sourceNodeId,
                target: scratchpadNodeId,
                sourceHandle,
                targetHandle,
                type: 'smoothstep',
                style: { 
                  stroke: isDarkMode ? '#3b82f6' : '#2563eb',
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                },
                animated: true
              };
              edges.push(edge);
            });
          }

          // Load images
          const imageResponse = await fetch(`/api/projects/${project.id}/images`);
          if (imageResponse.ok) {
            const images = await imageResponse.json();
            
            images.forEach(image => {
              const imageNodeId = image.id;
              const imageNode = {
                id: imageNodeId,
                type: 'imageNode',
                position: { x: Number(image.position_x) || 0, y: Number(image.position_y) || 0 },
                data: {
                  imageCard: {
                    id: image.id,
                    imageUrl: image.image_url || '',
                    imageAlt: image.image_alt || '',
                    projectId: project.id
                  },
                  onDelete: deleteImageNode,
                  onContextMenu: handleImageContextMenu
                },
                style: { 
                  width: DEFAULT_CARD_WIDTH, 
                  height: DEFAULT_CARD_HEIGHT 
                }
              };
              imageNodes.push(imageNode);
              
              // Create edge to project using stored handle information
              const sourceNodeId = `project-${project.id}`;
              
              // Use stored handles if available, otherwise fall back to smart calculation
              let sourceHandle = image.source_handle;
              let targetHandle = image.target_handle;
              
              // If no handles stored, calculate them (fallback for old data)
              if (!sourceHandle || !targetHandle) {
                const projectNode = projects.find(p => p.id === project.id);
                const projectIndex = projects.findIndex(p => p.id === project.id);
                const row = Math.floor(projectIndex / GRID_COLUMNS);
                const col = projectIndex % GRID_COLUMNS;
                const projectPos = {
                  x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP),
                  y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP)
                };
                
                const imagePos = { x: Number(image.position_x) || 0, y: Number(image.position_y) || 0 };
                const deltaX = imagePos.x - projectPos.x;
                const deltaY = imagePos.y - projectPos.y;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                  if (deltaX > 0) {
                    sourceHandle = 'project-output-right';
                    targetHandle = 'image-input-left';
                  } else {
                    sourceHandle = 'project-output-left';
                    targetHandle = 'image-input-right';
                  }
                } else {
                  if (deltaY > 0) {
                    sourceHandle = 'project-output-bottom';
                    targetHandle = 'image-input-top';
                  } else {
                    sourceHandle = 'project-output-top';
                    targetHandle = 'image-input-bottom';
                  }
                }
              }
              
              const edge = {
                id: `edge-${sourceNodeId}-${imageNodeId}`,
                source: sourceNodeId,
                target: imageNodeId,
                sourceHandle,
                targetHandle,
                type: 'smoothstep',
                style: { 
                  stroke: isDarkMode ? '#3b82f6' : '#2563eb',
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                },
                animated: true
              };
              edges.push(edge);
            });
          }

          // Load containers for this project
          const containerResponse = await fetch(`/api/projects/${project.id}/containers`);
          if (containerResponse.ok) {
            const containers = await containerResponse.json();
            
            containers.forEach(container => {
              const containerNode = {
                id: `container-${container.id}`,
                type: 'containerNode',
                position: { 
                  x: Number(container.position_x) || 0, 
                  y: Number(container.position_y) || 0 
                },
                data: {
                  containerCard: {
                    id: container.id,
                    label: container.label || 'Container',
                    color: container.color || '#3b82f6',
                    projectId: project.id
                  },
                  label: container.label || 'Container',
                  color: container.color || '#3b82f6',
                  size: { 
                    width: Number(container.width) || 300, 
                    height: Number(container.height) || 200 
                  },
                  onUpdateLabel: updateContainerLabel,
                  onUpdateColor: updateContainerColor,
                  onStartResize: startContainerResize,
                  onEndResize: endContainerResize,
                  onDelete: deleteContainer
                },
                style: { 
                  width: Number(container.width) || 300, 
                  height: Number(container.height) || 200,
                  zIndex: Number(container.z_index) || -1
                },
                zIndex: Number(container.z_index) || -1
              };
              
              containerNodes.push(containerNode);
            });
          }
        } catch (error) {
          console.error(`Error loading persisted data for project ${project.id}:`, error);
        }
      }
      
      // Create project nodes with saved positions from project data
      projects.forEach((project, index) => {
        // Use saved position if available, otherwise calculate default grid position
        let position;
        const savedX = project.position_x;
        const savedY = project.position_y;
        
        if (savedX !== null && savedY !== null && !isNaN(savedX) && !isNaN(savedY)) {
          position = { x: Number(savedX), y: Number(savedY) };
          console.log(`[ProjectCanvas] Loaded saved position for project ${project.id}:`, position);
        } else {
          const row = Math.floor(index / GRID_COLUMNS);
          const col = index % GRID_COLUMNS;
          position = { 
            x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP), 
            y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP) 
          };
          console.log(`[ProjectCanvas] Using default position for project ${project.id}:`, position);
        }
        
        const projectNode = {
          id: `project-${project.id}`,
          type: 'projectNode',
          position,
          data: { 
            project,
            pages: projectPages[project.id] || [],
            onContextMenu: handleContextMenu,
            onPageClick: (pageId, action) => handlePageClick(pageId, action, project),
            isConnecting
          },
          style: { 
            width: DEFAULT_CARD_WIDTH, 
            height: DEFAULT_CARD_HEIGHT 
          }
        };
        projectNodes.push(projectNode);
      });
      
      // Add all nodes to the canvas (replace all existing nodes to prevent duplicates)
      // Containers first (behind other nodes), then regular nodes
      setNodes([...containerNodes, ...projectNodes, ...chatNodes, ...taskNodes, ...scratchpadNodes, ...imageNodes]);
      
      // Replace all edges to prevent duplicates
      setEdges(edges);
    };
    
    loadPersistedData();
  }, [hasInitialized, projects, projectPages]);

  // Update node handlers when they change
  useEffect(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.type === 'chatNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onDelete: deleteChatNode,
              onContextMenu: handleChatContextMenu,
              isConnecting
            }
          };
        } else if (node.type === 'tasksNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onDelete: deleteTaskNode,
              onContextMenu: handleTasksContextMenu,
              isConnecting
            }
          };
        } else if (node.type === 'scratchpadNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onDelete: deleteScratchpadNode,
              onContextMenu: handleScratchpadContextMenu,
              isConnecting
            }
          };
        } else if (node.type === 'imageNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onDelete: deleteImageNode,
              onContextMenu: handleImageContextMenu,
              isConnecting
            }
          };
        } else if (node.type === 'projectNode') {
          return {
            ...node,
            data: {
              ...node.data,
              onContextMenu: handleContextMenu,
              onPageClick: (pageId, action) => handlePageClick(pageId, action, node.data.project),
              isConnecting
            }
          };
        }
        return node;
      })
    );
  }, [handleContextMenu, handleChatContextMenu, handleTasksContextMenu, handleScratchpadContextMenu, handleImageContextMenu, deleteChatNode, deleteTaskNode, deleteScratchpadNode, deleteImageNode, handlePageClick, isConnecting]);

  // Update lastNodesRef when nodes are loaded/updated (but not during drags)
  useEffect(() => {
    // Only update if we're not in the middle of a drag operation
    if (!savePositionsTimeoutRef.current) {
      lastNodesRef.current = [...nodes];
    }
  }, [nodes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savePositionsTimeoutRef.current) {
        clearTimeout(savePositionsTimeoutRef.current);
      }
    };
  }, []);

  // Global click handler to close all context menus
  useEffect(() => {
    const handleGlobalClick = (event) => {
      // Only close context menus if clicking outside of them
      const isContextMenuClick = event.target.closest('[data-context-menu]');
      if (!isContextMenuClick) {
        setContextMenu(null);
        setChatContextMenu(null);
        setTasksContextMenu(null);
        setScratchpadContextMenu(null);
        setImageContextMenu(null);
        setPaneContextMenu(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Find empty position for new chat nodes - dynamic placement in all directions
  const findEmptyPosition = useCallback((sourceNodeId) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return { x: 500, y: 0 };

    const offset = 500;
    const directions = [
      { x: offset, y: 0 },      // Right
      { x: -offset, y: 0 },     // Left  
      { x: 0, y: offset },      // Below
      { x: 0, y: -offset },     // Above
      { x: offset, y: offset }, // Bottom-right
      { x: -offset, y: offset }, // Bottom-left
      { x: offset, y: -offset }, // Top-right
      { x: -offset, y: -offset } // Top-left
    ];
    
    // Try each direction
    for (const direction of directions) {
      const candidatePos = { 
        x: sourceNode.position.x + direction.x, 
        y: sourceNode.position.y + direction.y
      };
      
      // Check for overlaps using proper rectangle collision detection
      const hasOverlap = nodes.some(node => {
        const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
        const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
        const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
        const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
        
        return !(
          candidatePos.x >= nodeRight ||
          candidateRight <= node.position.x ||
          candidatePos.y >= nodeBottom ||
          candidateBottom <= node.position.y
        );
      });
      
      if (!hasOverlap) {
        return candidatePos;
      }
    }
    
    // Fallback: spiral outward from source
    const spiralAttempts = 8;
    for (let i = 1; i <= spiralAttempts; i++) {
      const expandedOffset = offset + (i * 100);
      for (const direction of directions) {
        const candidatePos = { 
          x: sourceNode.position.x + (direction.x !== 0 ? Math.sign(direction.x) * expandedOffset : 0), 
          y: sourceNode.position.y + (direction.y !== 0 ? Math.sign(direction.y) * expandedOffset : 0)
        };
        
        const hasOverlap = nodes.some(node => {
          const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
          const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
          const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
          const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
          
          return !(
            candidatePos.x >= nodeRight ||
            candidateRight <= node.position.x ||
            candidatePos.y >= nodeBottom ||
            candidateBottom <= node.position.y
          );
        });
        
        if (!hasOverlap) {
          return candidatePos;
        }
      }
    }
    
    // Final fallback
    return { 
      x: sourceNode.position.x + offset, 
      y: sourceNode.position.y + (Math.random() * 200)
    };
  }, [nodes]);

  // Chat submission handler
  const handleChatSubmit = useCallback(async (query) => {
    if (!chatModal?.project) return;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          projectId: chatModal.project.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      
      // Find position for new chat node
      const sourceNodeId = `project-${chatModal.project.id}`;
      const emptyPosition = findEmptyPosition(sourceNodeId);
      
      // Calculate handles before saving to database
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      const sourcePos = sourceNode?.position || { x: 0, y: 0 };
      const targetPos = emptyPosition;
      
      const deltaX = targetPos.x - sourcePos.x;
      const deltaY = targetPos.y - sourcePos.y;
      
      let sourceHandle, targetHandle;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          sourceHandle = 'project-output-right';
          targetHandle = 'chat-input-left';
        } else {
          sourceHandle = 'project-output-left';
          targetHandle = 'chat-input-right';
        }
      } else {
        if (deltaY > 0) {
          sourceHandle = 'project-output-bottom';
          targetHandle = 'chat-input-top';
        } else {
          sourceHandle = 'project-output-top';
          targetHandle = 'chat-input-bottom';
        }
      }
      
      // Save chat message to database with handle information
      let chatNodeId = `chat-${Date.now()}`;
      try {
        const saveResponse = await fetch(`/api/projects/${chatModal.project.id}/chat-messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            response: data.answer || data.response,
            sources: data.widgets?.sources || [],
            positionX: emptyPosition.x,
            positionY: emptyPosition.y,
            sourceHandle,
            targetHandle
          }),
        });
        
        if (saveResponse.ok) {
          const savedMessage = await saveResponse.json();
          chatNodeId = savedMessage.id;
        }
      } catch (error) {
        console.error('Error saving chat message to database:', error);
      }
      
      // Create new chat node
      const newChatNode = {
        id: chatNodeId,
        type: 'chatNode',
        position: emptyPosition,
        data: { 
          chatCard: {
            id: chatNodeId,
            query,
            response: data.answer || data.response,
            sources: data.widgets?.sources || [],
            projectId: chatModal.project.id
          },
          onDelete: deleteChatNode,
          onContextMenu: handleChatContextMenu
        },
        style: { 
          width: DEFAULT_CARD_WIDTH, 
          height: DEFAULT_CARD_HEIGHT 
        }
      };
      
      // Create edge connection with smart handle selection
      const newEdge = {
        id: `edge-${sourceNodeId}-${chatNodeId}`,
        source: sourceNodeId,
        target: chatNodeId,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        style: { 
          stroke: isDarkMode ? '#3b82f6' : '#2563eb',
          strokeWidth: 2,
          strokeDasharray: '5,5'
        },
        animated: true
      };
      
      // Update state
      setNodes(prev => [...prev, newChatNode]);
      setEdges(prev => [...prev, newEdge]);
      
    } catch (error) {
      console.error('Error in chat submission:', error);
    }
  }, [chatModal, findEmptyPosition, isDarkMode]);

  // Create task node
  const createTaskNode = useCallback(async (sourceProjectId) => {
    const sourceNodeId = `project-${sourceProjectId}`;
    
    // Get current nodes to find empty position
    const getCurrentNodes = () => {
      let currentNodes = [];
      setNodes(prev => {
        currentNodes = prev;
        return prev;
      });
      return currentNodes;
    };
    
    const currentNodes = getCurrentNodes();
    const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
    
    // Use the same dynamic positioning logic as chat nodes
    const emptyPosition = (() => {
      if (!sourceNode) return { x: 500, y: 0 };
      
      const offset = 500;
      const directions = [
        { x: offset, y: 0 },      // Right
        { x: -offset, y: 0 },     // Left  
        { x: 0, y: offset },      // Below
        { x: 0, y: -offset },     // Above
        { x: offset, y: offset }, // Bottom-right
        { x: -offset, y: offset }, // Bottom-left
        { x: offset, y: -offset }, // Top-right
        { x: -offset, y: -offset } // Top-left
      ];
      
      // Try each direction
      for (const direction of directions) {
        const candidatePos = { 
          x: sourceNode.position.x + direction.x, 
          y: sourceNode.position.y + direction.y
        };
        
        // Check for overlaps using proper rectangle collision detection
        const hasOverlap = currentNodes.some(node => {
          const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
          const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
          const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
          const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
          
          return !(
            candidatePos.x >= nodeRight ||
            candidateRight <= node.position.x ||
            candidatePos.y >= nodeBottom ||
            candidateBottom <= node.position.y
          );
        });
        
        if (!hasOverlap) {
          return candidatePos;
        }
      }
      
      // Fallback: spiral outward from source
      const spiralAttempts = 8;
      for (let i = 1; i <= spiralAttempts; i++) {
        const expandedOffset = offset + (i * 100);
        for (const direction of directions) {
          const candidatePos = { 
            x: sourceNode.position.x + (direction.x !== 0 ? Math.sign(direction.x) * expandedOffset : 0), 
            y: sourceNode.position.y + (direction.y !== 0 ? Math.sign(direction.y) * expandedOffset : 0)
          };
          
          const hasOverlap = currentNodes.some(node => {
            const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
            const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
            const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
            const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
            
            return !(
              candidatePos.x >= nodeRight ||
              candidateRight <= node.position.x ||
              candidatePos.y >= nodeBottom ||
              candidateBottom <= node.position.y
            );
          });
          
          if (!hasOverlap) {
            return candidatePos;
          }
        }
      }
      
      // Final fallback
      return { 
        x: sourceNode.position.x + offset, 
        y: sourceNode.position.y + (Math.random() * 200)
      };
    })();
    
    // Calculate handles before saving to database
    const sourcePos = sourceNode?.position || { x: 0, y: 0 };
    const targetPos = emptyPosition;
    
    const deltaX = targetPos.x - sourcePos.x;
    const deltaY = targetPos.y - sourcePos.y;
    
    let sourceHandle, targetHandle;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        sourceHandle = 'project-output-right';
        targetHandle = 'tasks-input-left';
      } else {
        sourceHandle = 'project-output-left';
        targetHandle = 'tasks-input-right';
      }
    } else {
      if (deltaY > 0) {
        sourceHandle = 'project-output-bottom';
        targetHandle = 'tasks-input-top';
      } else {
        sourceHandle = 'project-output-top';
        targetHandle = 'tasks-input-bottom';
      }
    }
    
    // Save task list to database with handle information
    let taskNodeId = `tasks-${Date.now()}`;
    try {
      const saveResponse = await fetch(`/api/projects/${sourceProjectId}/task-lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Task List',
          positionX: emptyPosition.x,
          positionY: emptyPosition.y,
          sourceHandle,
          targetHandle
        }),
      });
      
      if (saveResponse.ok) {
        const savedTaskList = await saveResponse.json();
        taskNodeId = savedTaskList.id;
      } else {
        console.error('Failed to save task list to database');
      }
    } catch (error) {
      console.error('Error saving task list to database:', error);
    }
    
    const newTaskNode = {
      id: taskNodeId,
      type: 'tasksNode',
      position: emptyPosition,
      data: { 
        tasksCard: {
          id: taskNodeId,
          tasks: [],
          projectId: sourceProjectId
        },
        onDelete: deleteTaskNode,
        onContextMenu: handleTasksContextMenu
      },
      style: { 
        width: DEFAULT_CARD_WIDTH, 
        height: DEFAULT_CARD_HEIGHT 
      }
    };
    // Create edge connection using calculated handles
    const newEdge = {
      id: `edge-${sourceNodeId}-${taskNodeId}`,
      source: sourceNodeId,
      target: taskNodeId,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      style: { 
        stroke: isDarkMode ? '#3b82f6' : '#2563eb',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      animated: true
    };
    
    setNodes(prev => [...prev, newTaskNode]);
    setEdges(prev => [...prev, newEdge]);
  }, [isDarkMode, handleTasksContextMenu, setNodes, setEdges]);

  // Create scratchpad node
  const createScratchpadNode = useCallback(async (sourceProjectId) => {
    const sourceNodeId = `project-${sourceProjectId}`;
    
    // Get current nodes to find empty position
    const getCurrentNodes = () => {
      let currentNodes = [];
      setNodes(prev => {
        currentNodes = prev;
        return prev;
      });
      return currentNodes;
    };
    
    const currentNodes = getCurrentNodes();
    const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
    
    // Use the same dynamic positioning logic as other nodes
    const emptyPosition = (() => {
      if (!sourceNode) return { x: 500, y: 0 };
      
      const offset = 500;
      const directions = [
        { x: offset, y: 0 },      // Right
        { x: -offset, y: 0 },     // Left  
        { x: 0, y: offset },      // Below
        { x: 0, y: -offset },     // Above
        { x: offset, y: offset }, // Bottom-right
        { x: -offset, y: offset }, // Bottom-left
        { x: offset, y: -offset }, // Top-right
        { x: -offset, y: -offset } // Top-left
      ];
      
      // Try each direction
      for (const direction of directions) {
        const candidatePos = { 
          x: sourceNode.position.x + direction.x, 
          y: sourceNode.position.y + direction.y
        };
        
        // Check for overlaps using proper rectangle collision detection
        const hasOverlap = currentNodes.some(node => {
          const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
          const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
          const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
          const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
          
          return !(
            candidatePos.x >= nodeRight ||
            candidateRight <= node.position.x ||
            candidatePos.y >= nodeBottom ||
            candidateBottom <= node.position.y
          );
        });
        
        if (!hasOverlap) {
          return candidatePos;
        }
      }
      
      // Fallback: spiral outward from source
      const spiralAttempts = 8;
      for (let i = 1; i <= spiralAttempts; i++) {
        const expandedOffset = offset + (i * 100);
        for (const direction of directions) {
          const candidatePos = { 
            x: sourceNode.position.x + (direction.x !== 0 ? Math.sign(direction.x) * expandedOffset : 0), 
            y: sourceNode.position.y + (direction.y !== 0 ? Math.sign(direction.y) * expandedOffset : 0)
          };
          
          const hasOverlap = currentNodes.some(node => {
            const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
            const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
            const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
            const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
            
            return !(
              candidatePos.x >= nodeRight ||
              candidateRight <= node.position.x ||
              candidatePos.y >= nodeBottom ||
              candidateBottom <= node.position.y
            );
          });
          
          if (!hasOverlap) {
            return candidatePos;
          }
        }
      }
      
      // Final fallback
      return { 
        x: sourceNode.position.x + offset, 
        y: sourceNode.position.y + (Math.random() * 200)
      };
    })();
    
    // Calculate handles before saving to database  
    const sourcePos = sourceNode?.position || { x: 0, y: 0 };
    const targetPos = emptyPosition;
    
    const deltaX = targetPos.x - sourcePos.x;
    const deltaY = targetPos.y - sourcePos.y;
    
    let sourceHandle, targetHandle;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        sourceHandle = 'project-output-right';
        targetHandle = 'scratchpad-input-left';
      } else {
        sourceHandle = 'project-output-left';
        targetHandle = 'scratchpad-input-right';
      }
    } else {
      if (deltaY > 0) {
        sourceHandle = 'project-output-bottom';
        targetHandle = 'scratchpad-input-top';
      } else {
        sourceHandle = 'project-output-top';
        targetHandle = 'scratchpad-input-bottom';
      }
    }
    
    // Save scratchpad to database with handle information
    let scratchpadNodeId = `scratchpad-${Date.now()}`;
    try {
      const saveResponse = await fetch(`/api/projects/${sourceProjectId}/scratchpads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '',
          positionX: emptyPosition.x,
          positionY: emptyPosition.y,
          sourceHandle,
          targetHandle
        }),
      });
      
      if (saveResponse.ok) {
        const savedScratchpad = await saveResponse.json();
        scratchpadNodeId = savedScratchpad.id;
      } else {
        console.error('Failed to save scratchpad to database');
      }
    } catch (error) {
      console.error('Error saving scratchpad to database:', error);
    }
    
    const newScratchpadNode = {
      id: scratchpadNodeId,
      type: 'scratchpadNode',
      position: emptyPosition,
      data: { 
        scratchpadCard: {
          id: scratchpadNodeId,
          text: '',
          projectId: sourceProjectId
        },
        onDelete: deleteScratchpadNode,
        onContextMenu: handleScratchpadContextMenu
      },
      style: { 
        width: DEFAULT_CARD_WIDTH, 
        height: DEFAULT_CARD_HEIGHT 
      }
    };
    
    // Create edge connection using calculated handles
    const newEdge = {
      id: `edge-${sourceNodeId}-${scratchpadNodeId}`,
      source: sourceNodeId,
      target: scratchpadNodeId,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      style: { 
        stroke: isDarkMode ? '#3b82f6' : '#2563eb',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      animated: true
    };
    
    setNodes(prev => [...prev, newScratchpadNode]);
    setEdges(prev => [...prev, newEdge]);
  }, [isDarkMode, handleScratchpadContextMenu, setNodes, setEdges]);

  // Create image node
  const createImageNode = useCallback(async (sourceProjectId) => {
    const sourceNodeId = `project-${sourceProjectId}`;
    
    // Get current nodes to find empty position
    const getCurrentNodes = () => {
      let currentNodes = [];
      setNodes(prev => {
        currentNodes = prev;
        return prev;
      });
      return currentNodes;
    };
    
    const currentNodes = getCurrentNodes();
    const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
    
    // Use the same dynamic positioning logic as other nodes
    const emptyPosition = (() => {
      if (!sourceNode) return { x: 500, y: 0 };
      
      const offset = 500;
      const directions = [
        { x: offset, y: 0 },      // Right
        { x: -offset, y: 0 },     // Left  
        { x: 0, y: offset },      // Below
        { x: 0, y: -offset },     // Above
        { x: offset, y: offset }, // Bottom-right
        { x: -offset, y: offset }, // Bottom-left
        { x: offset, y: -offset }, // Top-right
        { x: -offset, y: -offset } // Top-left
      ];
      
      // Try each direction
      for (const direction of directions) {
        const candidatePos = { 
          x: sourceNode.position.x + direction.x, 
          y: sourceNode.position.y + direction.y
        };
        
        // Check for overlaps using proper rectangle collision detection
        const hasOverlap = currentNodes.some(node => {
          const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
          const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
          const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
          const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
          
          return !(
            candidatePos.x >= nodeRight ||
            candidateRight <= node.position.x ||
            candidatePos.y >= nodeBottom ||
            candidateBottom <= node.position.y
          );
        });
        
        if (!hasOverlap) {
          return candidatePos;
        }
      }
      
      // Fallback: spiral outward from source
      const spiralAttempts = 8;
      for (let i = 1; i <= spiralAttempts; i++) {
        const expandedOffset = offset + (i * 100);
        for (const direction of directions) {
          const candidatePos = { 
            x: sourceNode.position.x + (direction.x !== 0 ? Math.sign(direction.x) * expandedOffset : 0), 
            y: sourceNode.position.y + (direction.y !== 0 ? Math.sign(direction.y) * expandedOffset : 0)
          };
          
          const hasOverlap = currentNodes.some(node => {
            const nodeRight = node.position.x + DEFAULT_CARD_WIDTH;
            const nodeBottom = node.position.y + DEFAULT_CARD_HEIGHT;
            const candidateRight = candidatePos.x + DEFAULT_CARD_WIDTH;
            const candidateBottom = candidatePos.y + DEFAULT_CARD_HEIGHT;
            
            return !(
              candidatePos.x >= nodeRight ||
              candidateRight <= node.position.x ||
              candidatePos.y >= nodeBottom ||
              candidateBottom <= node.position.y
            );
          });
          
          if (!hasOverlap) {
            return candidatePos;
          }
        }
      }
      
      // Final fallback
      return { 
        x: sourceNode.position.x + offset, 
        y: sourceNode.position.y + (Math.random() * 200)
      };
    })();
    
    // Calculate handles before saving to database  
    const sourcePos = sourceNode?.position || { x: 0, y: 0 };
    const targetPos = emptyPosition;
    
    const deltaX = targetPos.x - sourcePos.x;
    const deltaY = targetPos.y - sourcePos.y;
    
    let sourceHandle, targetHandle;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        sourceHandle = 'project-output-right';
        targetHandle = 'image-input-left';
      } else {
        sourceHandle = 'project-output-left';
        targetHandle = 'image-input-right';
      }
    } else {
      if (deltaY > 0) {
        sourceHandle = 'project-output-bottom';
        targetHandle = 'image-input-top';
      } else {
        sourceHandle = 'project-output-top';
        targetHandle = 'image-input-bottom';
      }
    }
    
    // Save image to database with handle information
    let imageNodeId = `image-${Date.now()}`;
    try {
      const saveResponse = await fetch(`/api/projects/${sourceProjectId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: '',
          imageAlt: '',
          positionX: emptyPosition.x,
          positionY: emptyPosition.y,
          sourceHandle,
          targetHandle
        }),
      });
      
      if (saveResponse.ok) {
        const savedImage = await saveResponse.json();
        imageNodeId = savedImage.id;
      } else {
        console.error('Failed to save image to database');
      }
    } catch (error) {
      console.error('Error saving image to database:', error);
    }
    
    const newImageNode = {
      id: imageNodeId,
      type: 'imageNode',
      position: emptyPosition,
      data: { 
        imageCard: {
          id: imageNodeId,
          imageUrl: '',
          imageAlt: '',
          projectId: sourceProjectId
        },
        onDelete: deleteImageNode,
        onContextMenu: handleImageContextMenu
      },
      style: { 
        width: DEFAULT_CARD_WIDTH, 
        height: DEFAULT_CARD_HEIGHT 
      }
    };
    
    // Create edge connection using calculated handles
    const newEdge = {
      id: `edge-${sourceNodeId}-${imageNodeId}`,
      source: sourceNodeId,
      target: imageNodeId,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      style: { 
        stroke: isDarkMode ? '#3b82f6' : '#2563eb',
        strokeWidth: 2,
        strokeDasharray: '5,5'
      },
      animated: true
    };
    
    setNodes(prev => [...prev, newImageNode]);
    setEdges(prev => [...prev, newEdge]);
  }, [isDarkMode, handleImageContextMenu, setNodes, setEdges]);

  // Container manipulation functions
  const updateContainerLabel = useCallback(async (containerId, newLabel) => {
    console.log('ProjectCanvasNew: updateContainerLabel called with:', containerId, newLabel);
    
    // Get current nodes from state instead of closure
    setNodes(currentNodes => {
      const containerNodeId = `container-${containerId}`;
      console.log('ProjectCanvasNew: Looking for container node with ID:', containerNodeId);
      const containerNode = currentNodes.find(n => n.id === containerNodeId);
      console.log('ProjectCanvasNew: Found container node:', containerNode);
      
      if (!containerNode) {
        console.error('ProjectCanvasNew: Container node not found!');
        console.error('ProjectCanvasNew: Available node IDs:', currentNodes.map(n => n.id));
        return currentNodes; // Return unchanged nodes
      }
      
      // Update the container label
      const projectId = containerNode.data.containerCard.projectId;
      console.log('ProjectCanvasNew: Project ID:', projectId);
      
      // Make API call
      fetch(`/api/projects/${projectId}/containers/${containerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: newLabel }),
      }).then(response => {
        console.log('ProjectCanvasNew: API response status:', response.status);
        if (response.ok) {
          console.log('ProjectCanvasNew: API call successful, updating nodes...');
          setNodes(prevNodes => prevNodes.map(node => 
            node.id === containerNodeId 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    label: newLabel,
                    containerCard: { ...node.data.containerCard, label: newLabel }
                  } 
                }
              : node
          ));
          console.log('ProjectCanvasNew: Nodes updated successfully');
        } else {
          console.error('ProjectCanvasNew: API call failed with status:', response.status);
        }
      }).catch(error => {
        console.error('Error updating container label:', error);
      });
      
      return currentNodes; // Return unchanged nodes for now
    });
  }, [setNodes]);

  const updateContainerColor = useCallback(async (containerId, newColor) => {
    console.log('ProjectCanvasNew: updateContainerColor called with:', containerId, newColor);
    console.log('ProjectCanvasNew: updateContainerColor function started');
    
    // Get current nodes from state instead of closure
    setNodes(currentNodes => {
      console.log('ProjectCanvasNew: Current nodes array length:', currentNodes.length);
      console.log('ProjectCanvasNew: All node IDs:', currentNodes.map(n => n.id));
      
      const containerNodeId = `container-${containerId}`;
      console.log('ProjectCanvasNew: Looking for container node with ID:', containerNodeId);
      const containerNode = currentNodes.find(n => n.id === containerNodeId);
      console.log('ProjectCanvasNew: Found container node:', containerNode);
      
      if (!containerNode) {
        console.error('ProjectCanvasNew: Container node not found!');
        console.error('ProjectCanvasNew: Available node IDs:', currentNodes.map(n => n.id));
        return currentNodes; // Return unchanged nodes
      }
      
      // Update the container color
      const projectId = containerNode.data.containerCard.projectId;
      console.log('ProjectCanvasNew: Project ID:', projectId);
      
      // Make API call
      fetch(`/api/projects/${projectId}/containers/${containerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color: newColor }),
      }).then(response => {
        console.log('ProjectCanvasNew: API response status:', response.status);
        if (response.ok) {
          console.log('ProjectCanvasNew: API call successful, updating nodes...');
          setNodes(prevNodes => prevNodes.map(node => 
            node.id === containerNodeId 
              ? { 
                  ...node, 
                  data: { 
                    ...node.data, 
                    color: newColor,
                    containerCard: { ...node.data.containerCard, color: newColor }
                  } 
                }
              : node
          ));
          console.log('ProjectCanvasNew: Nodes updated successfully');
        } else {
          console.error('ProjectCanvasNew: API call failed with status:', response.status);
        }
      }).catch(error => {
        console.error('Error updating container color:', error);
      });
      
      return currentNodes; // Return unchanged nodes for now
    });
  }, [setNodes]);

  const updateContainerSize = useCallback(async (containerId, newWidth, newHeight) => {
    console.log('updateContainerSize called:', containerId, newWidth, newHeight);
    try {
      const containerNodeId = `container-${containerId}`;
      const containerNode = nodes.find(n => n.id === containerNodeId);
      if (!containerNode) {
        console.error('Container node not found:', containerNodeId);
        return;
      }
      
      const projectId = containerNode.data.containerCard.projectId;
      console.log('Updating container size via API:', projectId, containerId);
      
      const response = await fetch(`/api/projects/${projectId}/containers/${containerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ width: newWidth, height: newHeight }),
      });
      
      if (response.ok) {
        setNodes(prev => prev.map(node => 
          node.id === containerNodeId 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  size: { width: newWidth, height: newHeight }
                },
                style: {
                  ...node.style,
                  width: newWidth,
                  height: newHeight
                }
              }
            : node
        ));
      }
    } catch (error) {
      console.error('Error updating container size:', error);
      toast.error('Failed to update container size');
    }
  }, [nodes, setNodes]);

  const startContainerResize = useCallback((containerId) => {
    // Mark this container as resizing to disable heavy drag grouping work
    setNodes(prev => prev.map(node => {
      if (node.id === `container-${containerId}`) {
        return { ...node, data: { ...node.data, isResizing: true } };
      }
      return node;
    }));
  }, [setNodes]);

  const endContainerResize = useCallback((containerId) => {
    // Unmark resizing flag after resize completes
    setNodes(prev => prev.map(node => {
      if (node.id === `container-${containerId}`) {
        return { ...node, data: { ...node.data, isResizing: false } };
      }
      return node;
    }));
  }, [setNodes]);

  const deleteContainer = useCallback(async (containerId) => {
    console.log('ProjectCanvasNew: deleteContainer called with:', containerId);
    console.log('ProjectCanvasNew: deleteContainer function started at:', new Date().toISOString());
    
    // Get current nodes from state instead of closure
    setNodes(currentNodes => {
      const containerNodeId = `container-${containerId}`;
      console.log('ProjectCanvasNew: Looking for container node with ID:', containerNodeId);
      const containerNode = currentNodes.find(n => n.id === containerNodeId);
      console.log('ProjectCanvasNew: Found container node:', containerNode);
      
      if (!containerNode) {
        console.error('ProjectCanvasNew: Container node not found!');
        console.error('ProjectCanvasNew: Available node IDs:', currentNodes.map(n => n.id));
        return currentNodes; // Return unchanged nodes
      }
      
      // Delete the container
      const projectId = containerNode.data.containerCard.projectId;
      console.log('ProjectCanvasNew: Project ID:', projectId);
      
      // Make API call
      fetch(`/api/projects/${projectId}/containers/${containerId}`, {
        method: 'DELETE',
      }).then(response => {
        console.log('ProjectCanvasNew: API response status:', response.status);
        if (response.ok) {
          console.log('ProjectCanvasNew: API call successful, removing container from nodes...');
          setNodes(prevNodes => prevNodes.filter(node => node.id !== containerNodeId));
          console.log('ProjectCanvasNew: Showing success toast');
          toast.success('Container deleted');
          console.log('ProjectCanvasNew: Container removed successfully');
        } else {
          console.error('ProjectCanvasNew: API call failed with status:', response.status);
          console.log('ProjectCanvasNew: Showing error toast from response not ok');
          toast.error('Failed to delete container');
        }
      }).catch(error => {
        console.error('Error deleting container:', error);
        console.log('ProjectCanvasNew: Showing error toast from catch block');
        toast.error('Failed to delete container');
      });
      
      return currentNodes; // Return unchanged nodes for now
    });
  }, [setNodes]);

  // Create container
  const createContainer = useCallback(async (position) => {
    try {
      // Use the first project from the current projects list
      if (!projects || projects.length === 0) {
        toast.error('No projects available');
        return;
      }
      
      // For now, use the first project. In a real implementation, you might want to:
      // - Detect which project area the user clicked in
      // - Let the user choose the project
      // - Use a currently "active" project
      const projectId = projects[0].id;
      
      // Create container in database
      const containerResponse = await fetch(`/api/projects/${projectId}/containers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: 'New Container',
          color: '#3b82f6',
          positionX: position.x,
          positionY: position.y,
          width: 300,
          height: 200,
          zIndex: 0
        }),
      });
      
      if (!containerResponse.ok) {
        throw new Error('Failed to create container');
      }
      
      const containerData = await containerResponse.json();
      
      // Create container node
      const newContainerNode = {
        id: `container-${containerData.id}`,
        type: 'containerNode',
        position: { x: position.x, y: position.y },
        data: {
          containerCard: {
            id: containerData.id,
            label: containerData.label,
            color: containerData.color,
            projectId: projectId
          },
          label: containerData.label,
          color: containerData.color,
          size: { width: containerData.width, height: containerData.height },
          onUpdateLabel: updateContainerLabel,
          onUpdateColor: updateContainerColor,
          onUpdateSize: updateContainerSize,
          onStartResize: startContainerResize,
          onEndResize: endContainerResize,
          onDelete: deleteContainer
        },
        style: { 
          width: containerData.width, 
          height: containerData.height,
          zIndex: -1 // Ensure containers are behind nodes
        },
        zIndex: -1
      };
      
      setNodes(prev => [...prev, newContainerNode]);
      toast.success('Container created');
      
    } catch (error) {
      console.error('Error creating container:', error);
      toast.error('Failed to create container');
    }
  }, [projects, setNodes, updateContainerLabel, updateContainerColor, updateContainerSize, startContainerResize, deleteContainer]);


  // Helper function to check if a child node is already connected to a project
  const isChildNodeAlreadyConnected = useCallback((targetNodeId) => {
    return edges.some(edge => {
      const targetNode = nodes.find(n => n.id === edge.target);
      const sourceNode = nodes.find(n => n.id === edge.source);
      
      // Check if this edge connects a project node to the target child node
      return edge.target === targetNodeId && sourceNode?.type === 'projectNode';
    });
  }, [edges, nodes]);

  // Edge connection handler - handles manual reconnections
  const onConnect = useCallback((params) => {
    console.log('[ProjectCanvas] New connection created:', params);
    
    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    // Check if trying to connect from a project node to a child node that's already connected
    if (sourceNode?.type === 'projectNode' && targetNode && (targetNode.type === 'chatNode' || targetNode.type === 'tasksNode' || targetNode.type === 'scratchpadNode' || targetNode.type === 'imageNode')) {
      if (isChildNodeAlreadyConnected(params.target)) {
        console.log('[ProjectCanvas] Connection blocked: Child node already connected to a project');
        toast.error('This node already has a connection to a project');
        return; // Prevent the connection
      }
    }
    
    // Add the edge visually
    setEdges((eds) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: { 
          stroke: isDarkMode ? '#3b82f6' : '#2563eb',
          strokeWidth: 2,
          strokeDasharray: '5,5'
        },
        animated: true
      };
      return addEdge(newEdge, eds);
    });
    
    // Save the connection to database if it's between a project and a chat/task node
    
    if (sourceNode?.type === 'projectNode' && targetNode) {
      // Extract new project ID from source node
      const newProjectId = sourceNode.data.project.id;
      
      if (targetNode.type === 'chatNode' && targetNode.data.chatCard) {
        const oldProjectId = targetNode.data.chatCard.projectId;
        const isProjectTransfer = oldProjectId !== newProjectId;
        
        // Update chat node's project relationship
        const updateData = {
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        };
        
        if (isProjectTransfer) {
          updateData.projectId = newProjectId;
          console.log(`[ProjectCanvas] Transferring chat node ${targetNode.id} from project ${oldProjectId} to ${newProjectId}`);
        }
        
        fetch(`/api/projects/${oldProjectId}/chat-messages/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }).then(response => {
          if (response.ok && isProjectTransfer) {
            // Update the node's data in React Flow state
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNode.id 
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        chatCard: {
                          ...node.data.chatCard,
                          projectId: newProjectId
                        }
                      }
                    }
                  : node
              )
            );
          }
        }).catch(error => console.error('Error saving chat connection:', error));
        
        console.log('[ProjectCanvas] Saved chat node connection to database');
      } else if (targetNode.type === 'tasksNode' && targetNode.data.tasksCard) {
        const oldProjectId = targetNode.data.tasksCard.projectId;
        const isProjectTransfer = oldProjectId !== newProjectId;
        
        // Update task node's project relationship
        const updateData = {
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        };
        
        if (isProjectTransfer) {
          updateData.projectId = newProjectId;
          console.log(`[ProjectCanvas] Transferring task node ${targetNode.id} from project ${oldProjectId} to ${newProjectId}`);
        }
        
        fetch(`/api/projects/${oldProjectId}/task-lists/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }).then(response => {
          if (response.ok && isProjectTransfer) {
            // Update the node's data in React Flow state
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNode.id 
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        tasksCard: {
                          ...node.data.tasksCard,
                          projectId: newProjectId
                        }
                      }
                    }
                  : node
              )
            );
          }
        }).catch(error => console.error('Error saving task connection:', error));
        
        console.log('[ProjectCanvas] Saved task node connection to database');
      } else if (targetNode.type === 'scratchpadNode' && targetNode.data.scratchpadCard) {
        const oldProjectId = targetNode.data.scratchpadCard.projectId;
        const isProjectTransfer = oldProjectId !== newProjectId;
        
        // Update scratchpad node's project relationship
        const updateData = {
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        };
        
        if (isProjectTransfer) {
          updateData.projectId = newProjectId;
          console.log(`[ProjectCanvas] Transferring scratchpad node ${targetNode.id} from project ${oldProjectId} to ${newProjectId}`);
        }
        
        fetch(`/api/projects/${oldProjectId}/scratchpads/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }).then(response => {
          if (response.ok && isProjectTransfer) {
            // Update the node's data in React Flow state
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNode.id 
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        scratchpadCard: {
                          ...node.data.scratchpadCard,
                          projectId: newProjectId
                        }
                      }
                    }
                  : node
              )
            );
          }
        }).catch(error => console.error('Error saving scratchpad connection:', error));
        
        console.log('[ProjectCanvas] Saved scratchpad node connection to database');
      } else if (targetNode.type === 'imageNode' && targetNode.data.imageCard) {
        const oldProjectId = targetNode.data.imageCard.projectId;
        const isProjectTransfer = oldProjectId !== newProjectId;
        
        // Update image node's project relationship
        const updateData = {
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle
        };
        
        if (isProjectTransfer) {
          updateData.projectId = newProjectId;
          console.log(`[ProjectCanvas] Transferring image node ${targetNode.id} from project ${oldProjectId} to ${newProjectId}`);
        }
        
        fetch(`/api/projects/${oldProjectId}/images/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }).then(response => {
          if (response.ok && isProjectTransfer) {
            // Update the node's data in React Flow state
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNode.id 
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        imageCard: {
                          ...node.data.imageCard,
                          projectId: newProjectId
                        }
                      }
                    }
                  : node
              )
            );
          }
        }).catch(error => console.error('Error saving image connection:', error));
        
        console.log('[ProjectCanvas] Saved image node connection to database');
      }
      
      // Determine action type based on whether this is a cross-project transfer
      const oldProjectId = targetNode.data.chatCard?.projectId || 
                          targetNode.data.tasksCard?.projectId ||
                          targetNode.data.scratchpadCard?.projectId ||
                          targetNode.data.imageCard?.projectId;
      const actionType = oldProjectId !== newProjectId ? 'transferred to' : 'reconnected to';
      const nodeTypeLabel = targetNode.type === 'chatNode' ? 'Q/A Node' : 
                         targetNode.type === 'tasksNode' ? 'Task Node' :
                         targetNode.type === 'scratchpadNode' ? 'Scratchpad Node' :
                         targetNode.type === 'imageNode' ? 'Image Node' : 'Node';
    toast.success(`${nodeTypeLabel} ${actionType} project`);
    }
  }, [setEdges, isDarkMode, nodes, isChildNodeAlreadyConnected]);

  // Connection event handlers to track when user is making a connection
  const onConnectStart = useCallback(() => {
    console.log('[ProjectCanvas] Connection started');
    setIsConnecting(true);
  }, []);

  const onConnectEnd = useCallback(() => {
    console.log('[ProjectCanvas] Connection ended');
    setIsConnecting(false);
  }, []);

  // Handle selection events
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    console.log('Selected nodes:', selectedNodes.map(n => n.id));
    console.log('Selected edges:', selectedEdges.map(e => e.id));
  }, []);

  // Handle key press events for multi-selection and deletion
  const onNodesDelete = useCallback((deletedNodes) => {
    // Handle deletion of multiple nodes
    const deletedNodeIds = deletedNodes.map(node => node.id);
    console.log('Deleting nodes:', deletedNodeIds);
    
    // Remove associated edges
    setEdges(prev => prev.filter(edge => 
      !deletedNodeIds.includes(edge.source) && !deletedNodeIds.includes(edge.target)
    ));
  }, [setEdges]);

  // Handle React Flow node context menu
  const onNodeContextMenu = useCallback((event, node) => {
    console.log('React Flow node context menu', { event, node });
    event.preventDefault();
    
    if (node.type === 'chatNode' && node.data.chatCard) {
      handleChatContextMenu(event, node.data.chatCard);
    } else if (node.type === 'tasksNode' && node.data.tasksCard) {
      handleTasksContextMenu(event, node.data.tasksCard);
    } else if (node.type === 'scratchpadNode' && node.data.scratchpadCard) {
      handleScratchpadContextMenu(event, node.data.scratchpadCard);
    } else if (node.type === 'imageNode' && node.data.imageCard) {
      handleImageContextMenu(event, node.data.imageCard);
    } else if (node.type === 'projectNode' && node.data.project) {
      handleContextMenu(event, node.data.project);
    }
  }, [handleChatContextMenu, handleTasksContextMenu, handleContextMenu]);

  // Helper function to check if a node is inside a container
  const isNodeInsideContainer = useCallback((node, container) => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.style?.width || DEFAULT_CARD_WIDTH;
    const nodeHeight = node.style?.height || DEFAULT_CARD_HEIGHT;
    
    const containerX = container.position.x;
    const containerY = container.position.y;
    const containerWidth = container.style?.width || 300;
    const containerHeight = container.style?.height || 200;
    
    // Check if node center is inside container bounds
    const nodeCenterX = nodeX + nodeWidth / 2;
    const nodeCenterY = nodeY + nodeHeight / 2;
    
    return nodeCenterX >= containerX && 
           nodeCenterX <= containerX + containerWidth &&
           nodeCenterY >= containerY && 
           nodeCenterY <= containerY + containerHeight;
  }, []);

  // Handle node drag start to track containers
  const onNodeDragStart = useCallback((event, node) => {
    if (node.type === 'containerNode') {
      // Find all nodes inside this container
      const nodesInside = nodes.filter(n => 
        n.type !== 'containerNode' && 
        n.id !== node.id && 
        isNodeInsideContainer(n, node)
      );
      
      // Store the initial offset of each node relative to the container
      const offsets = new Map();
      nodesInside.forEach(n => {
        offsets.set(n.id, {
          x: n.position.x - node.position.x,
          y: n.position.y - node.position.y
        });
      });
      
      // Store this information for use during drag
      node.data.dragState = {
        nodesInside: nodesInside.map(n => n.id),
        offsets: offsets
      };
    }
  }, [nodes, isNodeInsideContainer]);

  // Handle container drag to move contained nodes
  const onNodeDrag = useCallback((event, node) => {
    if (node.type === 'containerNode' && node.data.dragState && !node.data.isResizing) {
      const { nodesInside, offsets } = node.data.dragState;
      
      // Update positions of nodes inside the container
      setNodes(prevNodes => 
        prevNodes.map(n => {
          if (nodesInside.includes(n.id)) {
            const offset = offsets.get(n.id);
            return {
              ...n,
              position: {
                x: node.position.x + offset.x,
                y: node.position.y + offset.y
              }
            };
          }
          return n;
        })
      );
    }
  }, [setNodes]);

  // Handle node drag end to save positions
  const onNodeDragStop = useCallback(async (event, node) => {
    if (node.type === 'chatNode' && node.data.chatCard) {
      try {
        await fetch(`/api/projects/${node.data.chatCard.projectId}/chat-messages/${node.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: Number(node.position.x) || 0,
            positionY: Number(node.position.y) || 0
          }),
        });
      } catch (error) {
        console.error('Error saving chat node position:', error);
      }
    } else if (node.type === 'tasksNode' && node.data.tasksCard) {
      try {
        await fetch(`/api/projects/${node.data.tasksCard.projectId}/task-lists/${node.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: Number(node.position.x) || 0,
            positionY: Number(node.position.y) || 0
          }),
        });
      } catch (error) {
        console.error('Error saving task node position:', error);
      }
    } else if (node.type === 'scratchpadNode' && node.data.scratchpadCard) {
      try {
        await fetch(`/api/projects/${node.data.scratchpadCard.projectId}/scratchpads/${node.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: Number(node.position.x) || 0,
            positionY: Number(node.position.y) || 0
          }),
        });
      } catch (error) {
        console.error('Error saving scratchpad node position:', error);
      }
    } else if (node.type === 'imageNode' && node.data.imageCard) {
      try {
        await fetch(`/api/projects/${node.data.imageCard.projectId}/images/${node.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: Number(node.position.x) || 0,
            positionY: Number(node.position.y) || 0
          }),
        });
      } catch (error) {
        console.error('Error saving image node position:', error);
      }
    } else if (node.type === 'projectNode' && node.data.project) {
      // Save project node position directly to project table
      try {
        const x = Number(node.position.x);
        const y = Number(node.position.y);
        
        // Only save if positions are valid numbers
        if (!isNaN(x) && !isNaN(y)) {
          console.log(`[ProjectCanvas] Saving position for project ${node.data.project.id}:`, { x, y });
          
          await fetch(`/api/projects/${node.data.project.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              positionX: x,
              positionY: y
            }),
          });
          
          console.log(`[ProjectCanvas] Successfully saved position for project ${node.data.project.id}`);
        } else {
          console.warn(`[ProjectCanvas] Invalid position values for project ${node.data.project.id}:`, node.position);
        }
      } catch (error) {
        console.error('Error saving project node position:', error);
      }
    } else if (node.type === 'containerNode' && node.data.containerCard) {
      console.log('ProjectCanvasNew: onNodeDragStop called for containerNode:', node.id);
      console.log('ProjectCanvasNew: Container position:', node.position);
      try {
        await fetch(`/api/projects/${node.data.containerCard.projectId}/containers/${node.data.containerCard.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            positionX: Number(node.position.x) || 0,
            positionY: Number(node.position.y) || 0
          }),
        });
      } catch (error) {
        console.error('Error saving container position:', error);
      }
    }
  }, []);

  if (!projects.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${theme.background2} max-w-md mx-auto mt-20`}>
        <h3 className={`text-xl font-semibold font-ibm-plex-sans ${theme.text}`}>
          Welcome to Cortex!
        </h3>
        <p className={`mt-2 ${theme.secondary}`}>
          Create your first project to start organizing your knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative selection-enabled">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onSelectionChange={onSelectionChange}
        onNodesDelete={onNodesDelete}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneContextMenu={handlePaneContextMenu}
        onPaneClick={() => {
          setPaneContextMenu(null);
          setContextMenu(null);
          setChatContextMenu(null);
          setTasksContextMenu(null);
          setScratchpadContextMenu(null);
          setImageContextMenu(null);
        }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.25}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        selectionOnDrag={true}
        panOnDrag={[1, 2]}
        panActivationKeyCode={['Space', panKey]}
        selectNodesOnDrag={false}
        selectionMode="partial"
        selectionKeyCode={null}
      >
        <Background 
          variant="dots" 
          gap={25} 
          size={2}
          color={isDarkMode ? '#374151' : '#9ca3af'}
        />
        <Controls />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onChat={() => handleChatWithProject(contextMenu.project)}
          onCreateTasks={() => createTaskNode(contextMenu.project.id)}
          onCreateScratchpad={() => createScratchpadNode(contextMenu.project.id)}
          onCreateImage={() => createImageNode(contextMenu.project.id)}
          onAddPage={() => handleAddPage(contextMenu.project)}
          onImportData={() => handleImportData(contextMenu.project)}
          onRegenerateVectors={() => handleRegenerateVectors(contextMenu.project)}
          onEdit={() => {
            window.location.href = `/projects/${contextMenu.project.id}`;
          }}
          onDelete={() => handleDeleteProject(contextMenu.project)}
        />
      )}

      {/* Pane Context Menu */}
      {paneContextMenu && (
        <div
          className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-48`}
          style={{
            left: paneContextMenu.x,
            top: paneContextMenu.y,
          }}
        >
          <button
            onClick={() => {
              // Use the exact click position (already converted to flow coordinates)
              createContainer(paneContextMenu.position);
              handleClosePaneContextMenu();
            }}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors cursor-pointer`}
          >
            <Container className={`w-4 h-4 ${theme.accent}`} />
            <span className={`text-sm ${theme.text}`}>Add Container</span>
          </button>
        </div>
      )}

      {/* Chat Context Menu */}
      {chatContextMenu && (
        <ChatContextMenu
          x={chatContextMenu.x}
          y={chatContextMenu.y}
          onClose={handleCloseChatContextMenu}
          onDelete={() => deleteChatNode(chatContextMenu.chatCard.id)}
          onCopyResponse={() => handleCopyResponse(chatContextMenu.chatCard)}
          onExportToFile={() => handleExportToFile(chatContextMenu.chatCard)}
          onDetach={() => handleDetachNode(chatContextMenu.chatCard.id, 'chatNode')}
        />
      )}

      {/* Tasks Context Menu */}
      {tasksContextMenu && (
        <TasksContextMenu
          x={tasksContextMenu.x}
          y={tasksContextMenu.y}
          onClose={handleCloseTasksContextMenu}
          onDelete={() => deleteTaskNode(tasksContextMenu.tasksCard.id)}
          onExportTasks={() => handleExportTasks(tasksContextMenu.tasksCard)}
          onDetach={() => handleDetachNode(tasksContextMenu.tasksCard.id, 'tasksNode')}
        />
      )}

      {/* Scratchpad Context Menu */}
      {scratchpadContextMenu && (
        <div
          className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-48`}
          style={{
            left: scratchpadContextMenu.x,
            top: scratchpadContextMenu.y,
          }}
        >
          <button
            onClick={() => {
              deleteScratchpadNode(scratchpadContextMenu.scratchpadCard.id);
              handleCloseScratchpadContextMenu();
            }}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors text-red-500`}
          >
            Delete scratchpad
          </button>
          <button
            onClick={() => {
              handleDetachNode(scratchpadContextMenu.scratchpadCard.id, 'scratchpadNode');
              handleCloseScratchpadContextMenu();
            }}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors ${theme.text}`}
          >
            Detach from project
          </button>
        </div>
      )}

      {/* Image Context Menu */}
      {imageContextMenu && (
        <div
          className={`fixed z-50 ${theme.background2} border ${theme.border} rounded-lg shadow-lg py-2 min-w-48`}
          style={{
            left: imageContextMenu.x,
            top: imageContextMenu.y,
          }}
        >
          <button
            onClick={() => {
              deleteImageNode(imageContextMenu.imageCard.id);
              handleCloseImageContextMenu();
            }}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors text-red-500`}
          >
            Delete image
          </button>
          <button
            onClick={() => {
              handleDetachNode(imageContextMenu.imageCard.id, 'imageNode');
              handleCloseImageContextMenu();
            }}
            className={`w-full px-4 py-2 text-left flex items-center gap-3 ${theme.hover} transition-colors ${theme.text}`}
          >
            Detach from project
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {chatModal && (
        <ChatModal
          isOpen={chatModal.isOpen}
          onClose={handleCloseChatModal}
          onSubmit={handleChatSubmit}
          projectTitle={chatModal.project.title}
          initialQuery={chatModal.initialQuery}
        />
      )}

      {/* Add Page Modal */}
      {addPageModal && (
        <AddPageModal
          project={addPageModal.project}
          isOpen={addPageModal.isOpen}
          onClose={handleCloseAddPageModal}
          onSubmit={handleCreatePage}
        />
      )}

      {/* Page Modal */}
      {pageModal && (
        <PageModal
          isOpen={pageModal.isOpen}
          onClose={handleClosePageModal}
          pageId={pageModal.pageId}
          projectId={pageModal.projectId}
          onPageDeleted={() => {
            // Refresh project pages after deletion
            const refreshPages = async () => {
              try {
                const response = await fetch(`/api/projects/${pageModal.projectId}/pages`);
                if (response.ok) {
                  const pagesData = await response.json();
                  setProjectPages(prev => ({
                    ...prev,
                    [pageModal.projectId]: pagesData
                  }));
                }
              } catch (error) {
                console.error('Error refreshing pages:', error);
              }
            };
            refreshPages();
          }}
        />
      )}

    </div>
  );
}

// Main exported component with ReactFlowProvider
export default function ProjectCanvas({ projects }) {
  return (
    <ReactFlowProvider>
      <ProjectCanvasFlow projects={projects} />
    </ReactFlowProvider>
  );
}
