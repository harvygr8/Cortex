'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'react-hot-toast';
import useThemeStore from '../../lib/stores/themeStore';
import ContextMenu from './ContextMenu';
import ChatContextMenu from './ChatContextMenu';
import ChatModal from './ChatModal';
import AddPageModal from './AddPageModal';
import ProjectNode from './ProjectNode';
import ChatNode from './ChatNode';

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
};

// React Flow wrapper component
function ProjectCanvasFlow({ projects }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  // Detect OS for pan key (Cmd on Mac, Ctrl on Windows/Linux)
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const panKey = isMac ? 'Meta' : 'Control';
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // App state
  const [projectPages, setProjectPages] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [chatContextMenu, setChatContextMenu] = useState(null);
  const [chatModal, setChatModal] = useState(null);
  const [addPageModal, setAddPageModal] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

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

  // Initialize nodes from projects - separate effect to avoid loops
  useEffect(() => {
    const projectNodes = projects.map((project, index) => {
      const row = Math.floor(index / GRID_COLUMNS);
      const col = index % GRID_COLUMNS;
      
      return {
        id: `project-${project.id}`,
        type: 'projectNode',
        position: { 
          x: col * (DEFAULT_CARD_WIDTH + GRID_H_GAP), 
          y: row * (DEFAULT_CARD_HEIGHT + GRID_V_GAP) 
        },
        data: { 
          project,
          pages: projectPages[project.id] || [],
          onContextMenu: handleContextMenu
        },
        style: { 
          width: DEFAULT_CARD_WIDTH, 
          height: DEFAULT_CARD_HEIGHT 
        }
      };
    });
    
    // Update existing nodes to ensure all have the latest handlers
    setNodes(prevNodes => {
      const updatedNodes = prevNodes.map(node => {
        if (node.type === 'chatNode') {
          // Ensure chat nodes have the context menu handler
          return {
            ...node,
            data: {
              ...node.data,
              onContextMenu: handleChatContextMenu
            }
          };
        }
        return node;
      });
      
      // Add project nodes (replacing any existing project nodes)
      const nonProjectNodes = updatedNodes.filter(node => node.type !== 'projectNode');
      return [...nonProjectNodes, ...projectNodes];
    });
  }, [projects, projectPages, handleContextMenu, handleChatContextMenu]);

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
      
      // Create new chat node
      const chatNodeId = `chat-${Date.now()}`;
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
      
      // Smart handle selection based on relative positions
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      const sourcePos = sourceNode?.position || { x: 0, y: 0 };
      const targetPos = emptyPosition;
      
      // Calculate relative position
      const deltaX = targetPos.x - sourcePos.x;
      const deltaY = targetPos.y - sourcePos.y;
      
      // Debug logging
      console.log('Connection Debug:', {
        sourcePos,
        targetPos,
        deltaX,
        deltaY,
        absX: Math.abs(deltaX),
        absY: Math.abs(deltaY)
      });
      
      // Choose handles based on relative position
      let sourceHandle, targetHandle;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal connection preferred
        if (deltaX > 0) {
          sourceHandle = 'project-output-right';
          targetHandle = 'chat-input-left';
          console.log('Connection: Right → Left');
        } else {
          sourceHandle = 'project-output-left';
          targetHandle = 'chat-input-right';
          console.log('Connection: Left → Right');
        }
      } else {
        // Vertical connection preferred
        if (deltaY > 0) {
          sourceHandle = 'project-output-bottom';
          targetHandle = 'chat-input-top';
          console.log('Connection: Bottom → Top');
        } else {
          sourceHandle = 'project-output-top';
          targetHandle = 'chat-input-bottom';
          console.log('Connection: Top → Bottom');
        }
      }
      
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

  // Delete chat node
  const deleteChatNode = useCallback((chatNodeId) => {
    setNodes(prev => prev.filter(node => node.id !== chatNodeId));
    setEdges(prev => prev.filter(edge => 
      edge.source !== chatNodeId && edge.target !== chatNodeId
    ));
  }, [setNodes, setEdges]);


  // Edge connection handler
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
    } else if (node.type === 'projectNode' && node.data.project) {
      handleContextMenu(event, node.data.project);
    }
  }, [handleChatContextMenu, handleContextMenu]);

  if (!projects.length) {
    return (
      <div className={`p-8 rounded-lg shadow-sm ${theme.background2} max-w-md mx-auto mt-20`}>
        <h3 className={`text-xl font-semibold font-source-sans-3 ${theme.text}`}>
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
        onSelectionChange={onSelectionChange}
        onNodesDelete={onNodesDelete}
        onNodeContextMenu={onNodeContextMenu}
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
          onAddPage={() => handleAddPage(contextMenu.project)}
          onImportData={() => handleImportData(contextMenu.project)}
          onRegenerateVectors={() => handleRegenerateVectors(contextMenu.project)}
          onEdit={() => {
            window.location.href = `/projects/${contextMenu.project.id}`;
          }}
          onDelete={() => handleDeleteProject(contextMenu.project)}
        />
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
        />
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
