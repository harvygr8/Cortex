'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  ReactFlowProvider 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaRedo } from 'react-icons/fa';
import useThemeStore from '../../lib/stores/themeStore';
import ContextMenu from './ContextMenu';
import ChatModal from './ChatModal';
import ProjectNode from './ProjectNode';
import ChatNode from './ChatNode';

// Large virtual canvas to simulate an "infinite" workspace
const VIRTUAL_CANVAS_SIZE = 20000; // 20k x 20k px
const ORIGIN_OFFSET = VIRTUAL_CANVAS_SIZE / 2; // Center origin inside virtual canvas
const STORAGE_KEY = 'cortex-project-positions-v2';
const LEGACY_STORAGE_KEY = 'cortex-project-positions';

// Default card and grid settings
const DEFAULT_CARD_WIDTH = 420;
const DEFAULT_CARD_HEIGHT = 320;
const GRID_COLUMNS = 3; // Fit at least 3 per row on reset
const GRID_H_GAP = 80;
const GRID_V_GAP = 80;
const GRID_STEP_X = DEFAULT_CARD_WIDTH + GRID_H_GAP; // 500
const GRID_STEP_Y = DEFAULT_CARD_HEIGHT + GRID_V_GAP; // 400

// Custom node types for React Flow
const nodeTypes = {
  projectNode: ProjectNode,
  chatNode: ChatNode,
};

// React Flow wrapper component
function ProjectCanvasFlow({ projects }) {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // App state
  const [projectPages, setProjectPages] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [chatModal, setChatModal] = useState(null);

  // Compute default centered grid positions
  const computeDefaultPositions = () => {
    const next = {};
    projects.forEach((project, index) => {
      const row = Math.floor(index / GRID_COLUMNS);
      const col = index % GRID_COLUMNS;
      next[project.id] = {
        x: ORIGIN_OFFSET + col * GRID_STEP_X + 50,
        y: ORIGIN_OFFSET + row * GRID_STEP_Y + 50,
        width: DEFAULT_CARD_WIDTH,
        height: DEFAULT_CARD_HEIGHT
      };
    });
    return next;
  };

  // Load saved positions from localStorage and fetch pages
  useEffect(() => {
    const savedV2 = localStorage.getItem(STORAGE_KEY);
    if (savedV2) {
      setProjectPositions(JSON.parse(savedV2));
    } else {
      const savedLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (savedLegacy) {
        const legacy = JSON.parse(savedLegacy);
        const migrated = Object.fromEntries(
          Object.entries(legacy).map(([id, pos]) => [
            id,
            {
              x: (pos?.x ?? 0) + ORIGIN_OFFSET,
              y: (pos?.y ?? 0) + ORIGIN_OFFSET,
              width: pos?.width ?? 600,
              height: pos?.height ?? 450
            }
          ])
        );
        setProjectPositions(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } else {
        // Generate initial grid positions for new projects (larger containers)
        const initialPositions = {};
        projects.forEach((project, index) => {
          const row = Math.floor(index / GRID_COLUMNS);
          const col = index % GRID_COLUMNS;
          initialPositions[project.id] = {
            x: ORIGIN_OFFSET + col * GRID_STEP_X + 50, // offset from center
            y: ORIGIN_OFFSET + row * GRID_STEP_Y + 50, // offset from center
            width: DEFAULT_CARD_WIDTH,
            height: DEFAULT_CARD_HEIGHT
          };
        });
        setProjectPositions(initialPositions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPositions));
      }
    }

    // Fetch pages for all projects
    fetchAllProjectPages();
  }, [projects]);

  const fetchAllProjectPages = async () => {
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
  };

  // Save positions to localStorage
  const savePositions = (newPositions) => {
    setProjectPositions(newPositions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPositions));
  };

  const handleDragStop = (projectId, d) => {
    const newPositions = {
      ...projectPositions,
      [projectId]: {
        ...projectPositions[projectId],
        x: d.x,
        y: d.y
      }
    };
    savePositions(newPositions);
  };

  const handleResizeStop = (projectId, ref, position) => {
    const newPositions = {
      ...projectPositions,
      [projectId]: {
        x: position.x,
        y: position.y,
        width: parseInt(ref.style.width),
        height: parseInt(ref.style.height)
      }
    };
    savePositions(newPositions);
  };

  // Zoom and Pan handlers
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2.5; // Slightly reduced for performance

  const handleWheel = (e) => {
    e.preventDefault();
    if (isDraggingItem) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY;
    const zoomFactor = Math.exp(delta * 0.0015);
    const newZoomUnclamped = zoom * zoomFactor;
    const newZoom = Math.min(Math.max(MIN_ZOOM, newZoomUnclamped), MAX_ZOOM);

    const scale = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scale;
    const newPanY = mouseY - (mouseY - pan.y) * scale;

    setPan({ x: newPanX, y: newPanY });
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (isDraggingItem) return;
    const isLeftClick = e.button === 0;
    const isMiddleClick = e.button === 1;
    const isOnCanvasBackground = !e.target.closest('.canvas-item');

    if ((isLeftClick || isMiddleClick) && isOnCanvasBackground) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingItem) {
      setIsPanning(false);
      return;
    }
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetLayout = () => {
    const defaults = computeDefaultPositions();
    savePositions(defaults);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleContextMenu = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      project: project
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleChatWithProject = (project) => {
    setChatModal({
      project: project,
      isOpen: true
    });
  };

  const handleCloseChatModal = () => {
    setChatModal(null);
  };

  // Function to find an empty position for new chat cards
  const findEmptyPosition = (sourceProjectId) => {
    const sourcePos = projectPositions[sourceProjectId];
    if (!sourcePos) return { x: ORIGIN_OFFSET + 550, y: ORIGIN_OFFSET + 50 };

    // Get all existing card positions
    const allPositions = [
      ...Object.values(projectPositions),
      ...chatCards.map(card => card.position)
    ];

    const cardWidth = DEFAULT_CARD_WIDTH;
    const cardHeight = DEFAULT_CARD_HEIGHT;
    const padding = 50;

    // Try positions in a spiral pattern around the source project
    const positions = [
      // Right side positions
      { x: sourcePos.x + sourcePos.width + padding, y: sourcePos.y },
      { x: sourcePos.x + sourcePos.width + padding, y: sourcePos.y + sourcePos.height + padding },
      { x: sourcePos.x + sourcePos.width + padding, y: sourcePos.y - cardHeight - padding },
      
      // Left side positions
      { x: sourcePos.x - cardWidth - padding, y: sourcePos.y },
      { x: sourcePos.x - cardWidth - padding, y: sourcePos.y + sourcePos.height + padding },
      { x: sourcePos.x - cardWidth - padding, y: sourcePos.y - cardHeight - padding },
      
      // Below positions
      { x: sourcePos.x, y: sourcePos.y + sourcePos.height + padding },
      { x: sourcePos.x + sourcePos.width + padding, y: sourcePos.y + sourcePos.height + padding },
      { x: sourcePos.x - cardWidth - padding, y: sourcePos.y + sourcePos.height + padding },
      
      // Above positions
      { x: sourcePos.x, y: sourcePos.y - cardHeight - padding },
      { x: sourcePos.x + sourcePos.width + padding, y: sourcePos.y - cardHeight - padding },
      { x: sourcePos.x - cardWidth - padding, y: sourcePos.y - cardHeight - padding },
    ];

    // Check each position for overlaps
    for (const pos of positions) {
      let hasOverlap = false;
      
      for (const existingPos of allPositions) {
        // Check if rectangles overlap
        const overlap = !(
          pos.x + cardWidth < existingPos.x ||
          existingPos.x + existingPos.width < pos.x ||
          pos.y + cardHeight < existingPos.y ||
          existingPos.y + existingPos.height < pos.y
        );
        
        if (overlap) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        return { x: pos.x, y: pos.y };
      }
    }

    // If no empty position found, use offset from source with some randomness
    return {
      x: sourcePos.x + sourcePos.width + padding + (Math.random() * 200),
      y: sourcePos.y + (Math.random() * 100 - 50)
    };
  };

  const handleChatSubmit = async (query) => {
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
      
      // Find an empty position for the new chat card
      const emptyPosition = findEmptyPosition(chatModal.project.id);
      
      // Create a new chat card
      const newChatCard = {
        id: `chat-${Date.now()}`,
        type: 'chat',
        query: query,
        response: data.answer || data.response,
        sources: data.widgets?.sources || [],
        projectId: chatModal.project.id,
        position: {
          x: emptyPosition.x,
          y: emptyPosition.y,
          width: DEFAULT_CARD_WIDTH,
          height: DEFAULT_CARD_HEIGHT
        }
      };

      setChatCards(prev => [...prev, newChatCard]);
    } catch (error) {
      console.error('Error in chat submission:', error);
      // You could show a toast notification here
    }
  };

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
    <div 
      className="relative w-full min-h-screen overflow-hidden"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Reset Layout button (fixed overlay) */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleResetLayout}
          className={`w-12 h-12 rounded-full ${theme.background2} shadow-md hover:shadow-lg transition-all ${theme.text} flex items-center justify-center hover:scale-105`}
          title="Reset layout"
          aria-label="Reset layout"
        >
          <FaRedo className="w-5 h-5" />
        </button>
      </div>
      {/* Transformed canvas content (pan + zoom) */}
      <div 
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Large virtual canvas to bound items */}
        <div 
          className="virtual-canvas relative"
          style={{ 
            width: VIRTUAL_CANVAS_SIZE, 
            height: VIRTUAL_CANVAS_SIZE,
            left: -ORIGIN_OFFSET, 
            top: -ORIGIN_OFFSET,
            overflow: 'visible'
          }}
        >
          {/* Dot pattern background */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at center, #666 1.5px, transparent 1.5px)`,
              backgroundSize: '25px 25px',
              opacity: 0.3,
              zIndex: 0
            }}
          />

          {/* Draggable project containers */}
          {projects.map((project) => {
          const position = projectPositions[project.id] || { x: ORIGIN_OFFSET + 50, y: ORIGIN_OFFSET + 50, width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT };
          const pages = projectPages[project.id] || [];
          
          return (
            <Rnd
              key={project.id}
              size={{ width: position.width, height: position.height }}
              position={{ x: position.x, y: position.y }}
              onDragStart={() => setIsDraggingItem(true)}
              onDragStop={(e, d) => { setIsDraggingItem(false); handleDragStop(project.id, d); }}
              onResizeStop={(e, direction, ref, delta, position) => 
                { setIsDraggingItem(false); handleResizeStop(project.id, ref, position); }
              }
              onResizeStart={() => setIsDraggingItem(true)}
              minWidth={DEFAULT_CARD_WIDTH}
              minHeight={DEFAULT_CARD_HEIGHT}
              maxWidth={DEFAULT_CARD_WIDTH + 300}
              maxHeight={DEFAULT_CARD_HEIGHT + 300}
              bounds=".virtual-canvas"
              className="group"
              style={{ zIndex: 1 }}
              scale={zoom}
            >
              <div 
                className="w-full h-full canvas-item"
                onContextMenu={(e) => handleContextMenu(e, { ...project, position })}
              >
                <div className={`
                  p-4 rounded-lg shadow-md hover:shadow-lg transition-all 
                  h-full flex flex-col
                  ${theme.background2}
                  border-2 border-gray-300/30 hover:border-blue-300/50
                `}>
                  {/* Project Header */}
                  <div className="flex justify-between items-start mb-4 cursor-move">
                    <h3 className={`text-lg font-semibold font-source-sans-3 line-clamp-1 ${theme.text}`}>
                      {project.title}
                    </h3>
                    <span className={`text-sm whitespace-nowrap ml-2 ${theme.secondary} flex items-center gap-1`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {pages.length}
                    </span>
                  </div>

                  {/* Project Description */}
                  {project.description && (
                    <div className="mb-3 cursor-move">
                      <p className={`text-xs ${theme.secondary} line-clamp-2`}>
                        {project.description}
                      </p>
                    </div>
                  )}

                  {/* Pages Container */}
                  <div className="flex-1 overflow-y-auto">
                    {pages.length === 0 ? (
                      <div className={`p-4 rounded ${theme.background} text-center`}>
                        <p className={`text-sm ${theme.secondary}`}>
                          No pages yet
                        </p>
                        <Link href={`/projects/${project.id}`} className={`text-xs ${theme.accent} hover:underline`}>
                          Add first page →
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {pages.slice(0, 8).map((page) => (
                          <Link 
                            key={page.id} 
                            href={`/projects/${project.id}/pages/${page.id}`}
                            className="block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={`
                              p-3 rounded border transition-all hover:shadow-md
                              ${theme.background} border-gray-200/50 hover:border-blue-200/70
                              cursor-pointer
                            `}>
                              <h4 className={`text-sm font-medium font-source-sans-3 ${theme.text} line-clamp-1`}>
                                {page.title}
                              </h4>
                              {page.content && (
                                <p className={`text-xs ${theme.secondary} line-clamp-2 mt-1`}>
                                  {page.content}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                        {pages.length > 8 && (
                          <Link 
                            href={`/projects/${project.id}`}
                            className="block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={`
                              p-3 rounded border transition-all hover:shadow-md text-center
                              ${theme.background} border-gray-200/50 hover:border-blue-200/70
                              cursor-pointer
                            `}>
                              <p className={`text-xs ${theme.secondary}`}>
                                +{pages.length - 8} more pages
                              </p>
                            </div>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Footer */}
                  <div className="mt-3 pt-2 border-t border-gray-200/30 cursor-move">
                    <p className={`text-xs ${theme.secondary}`}>
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Recently created'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Resize handles */}
              <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`w-full h-full bg-gray-400/50 border-r-2 border-b-2 border-gray-400/70`} />
              </div>
            </Rnd>
          );
        })}

        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {chatCards.map((chatCard) => {
            // Find the source project
            const sourceProject = projects.find(p => p.id === chatCard.projectId);
            if (!sourceProject) return null;
            
            const sourcePos = projectPositions[sourceProject.id];
            if (!sourcePos) return null;
            
            // Calculate connection points (center of cards)
            const sourceX = sourcePos.x + sourcePos.width / 2;
            const sourceY = sourcePos.y + sourcePos.height / 2;
            const targetX = chatCard.position.x + chatCard.position.width / 2;
            const targetY = chatCard.position.y + chatCard.position.height / 2;
            
            return (
              <line
                key={`connection-${chatCard.id}`}
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke={isDarkMode ? '#3b82f6' : '#2563eb'}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
              />
            );
          })}
        </svg>

        {/* Chat Cards */}
        {chatCards.map((chatCard) => (
          <Rnd
            key={chatCard.id}
            size={{ width: chatCard.position.width, height: chatCard.position.height }}
            position={{ x: chatCard.position.x, y: chatCard.position.y }}
            onDragStop={(e, d) => {
              setChatCards(prev => prev.map(card => 
                card.id === chatCard.id 
                  ? { ...card, position: { ...card.position, x: d.x, y: d.y } }
                  : card
              ));
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setChatCards(prev => prev.map(card => 
                card.id === chatCard.id 
                  ? { 
                      ...card, 
                      position: { 
                        x: position.x, 
                        y: position.y, 
                        width: parseInt(ref.style.width), 
                        height: parseInt(ref.style.height) 
                      } 
                    }
                  : card
              ));
            }}
            minWidth={DEFAULT_CARD_WIDTH}
            minHeight={DEFAULT_CARD_HEIGHT}
            maxWidth={DEFAULT_CARD_WIDTH + 300}
            maxHeight={DEFAULT_CARD_HEIGHT + 300}
            bounds=".virtual-canvas"
            className="group"
            style={{ zIndex: 2 }}
            scale={zoom}
          >
            <div className="w-full h-full canvas-item">
              <div className={`
                p-4 rounded-lg shadow-md border-2 border-blue-300/50
                h-full flex flex-col
                ${theme.background2}
              `}>
                {/* Chat Header */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className={`text-sm font-semibold font-source-sans-3 ${theme.text} flex items-center gap-2`}>
                    💬 Chat Response
                  </h3>
                  <button
                    onClick={() => setChatCards(prev => prev.filter(card => card.id !== chatCard.id))}
                    className={`text-xs ${theme.secondary} hover:text-red-500 transition-colors`}
                  >
                    ✕
                  </button>
                </div>

                {/* Query */}
                <div className="mb-2">
                  <p className={`text-xs font-medium ${theme.text} mb-1`}>Query:</p>
                  <p className={`text-xs ${theme.secondary} italic`}>"{chatCard.query}"</p>
                </div>

                {/* Response */}
                <div className="flex-1 overflow-y-auto">
                  <p className={`text-xs font-medium ${theme.text} mb-2`}>Response:</p>
                  <div className={`text-xs ${theme.text} leading-relaxed`}>
                    {chatCard.response}
                  </div>
                  
                  {/* Sources */}
                  {chatCard.sources && chatCard.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200/30">
                      <div className="flex flex-wrap gap-1">
                        {chatCard.sources.map((source, idx) => (
                          <div key={idx} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${theme.border} ${theme.background}`}>
                            <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {typeof source === 'string' ? source : source.title || 'Unknown source'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Rnd>
        ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onChat={() => handleChatWithProject(contextMenu.project)}
          onEdit={() => {
            // Handle edit - navigate to project page
            window.location.href = `/projects/${contextMenu.project.id}`;
          }}
          onDelete={() => {
            // Handle delete - could implement delete functionality
            console.log('Delete project:', contextMenu.project.id);
          }}
          onDuplicate={() => {
            // Handle duplicate - could implement duplication
            console.log('Duplicate project:', contextMenu.project.id);
          }}
        />
      )}

      {/* Chat Modal with Connection Line */}
      {chatModal && (
        <>
          {/* Connection line from project to modal */}
          <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 49 }}>
            {(() => {
              const sourcePos = projectPositions[chatModal.project.id];
              if (!sourcePos) return null;
              
              // Transform project position to screen coordinates
              const sourceScreenX = (sourcePos.x + sourcePos.width / 2) * zoom + pan.x;
              const sourceScreenY = (sourcePos.y + sourcePos.height / 2) * zoom + pan.y;
              
              // Modal is centered on screen
              const modalX = window.innerWidth / 2;
              const modalY = window.innerHeight / 2;
              
              return (
                <line
                  x1={sourceScreenX}
                  y1={sourceScreenY}
                  x2={modalX}
                  y2={modalY}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  opacity="0.8"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))'
                  }}
                />
              );
            })()}
          </svg>
          
          <ChatModal
            isOpen={chatModal.isOpen}
            onClose={handleCloseChatModal}
            onSubmit={handleChatSubmit}
            projectTitle={chatModal.project.title}
          />
        </>
      )}
    </div>
  );
}
