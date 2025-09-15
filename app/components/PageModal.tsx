'use client';

import { useState, useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import useProjectStore from '../../lib/stores/projectStore';
import useThemeStore from '../../lib/stores/themeStore';
import MarkdownPreview from './MarkdownPreview';
import DeletePageButton from './DeletePageButton';
import Loader from './Loader';

export default function PageModal({ isOpen, onClose, pageId, projectId, onPageDeleted }) {
  const [page, setPage] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (isOpen && projectId && pageId) {
      setActiveProjectId(projectId);
      fetchPageData();
    }
  }, [isOpen, projectId, pageId, setActiveProjectId]);

  const fetchPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pageRes, projectRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/pages/${pageId}`),
        fetch(`/api/projects/${projectId}`)
      ]);

      if (!pageRes.ok || !projectRes.ok) {
        throw new Error('Failed to fetch page data');
      }

      const [pageData, projectData] = await Promise.all([
        pageRes.json(),
        projectRes.json()
      ]);

      setPage(pageData);
      setProject(projectData);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContentSave = async (newContent) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        const updatedPage = await response.json();
        setPage(updatedPage);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handlePageDeleted = () => {
    onClose();
    if (onPageDeleted) {
      onPageDeleted();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center`}
      onClick={handleOverlayClick}
    >
      <div className={`${theme.modal?.background || theme.background} ${theme.modal?.text || theme.text} rounded-lg w-full max-w-5xl h-[85vh] mx-4 shadow-xl relative flex flex-col overflow-hidden`}>
        {/* Modal Header */}
        <div className={`${theme.background2} px-6 py-4 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex-1">
            <h1 className={`text-xl font-semibold font-ibm-plex-sans ${theme.text}`}>
              {page?.title || 'Loading...'}
            </h1>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-4">
            {page && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity w-11 h-11 flex items-center justify-center`}
                  title="Edit Page"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <DeletePageButton 
                  pageId={pageId} 
                  projectId={projectId} 
                  onPageDeleted={handlePageDeleted} 
                />
              </>
            )}
            <button
              onClick={handleClose}
              className={`p-3 rounded-lg ${theme.button} hover:opacity-80 transition-opacity w-11 h-11 flex items-center justify-center`}
              title={isEditing ? "Cancel Edit & Close" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-lg mb-4 ${theme.text}`}>Error: {error}</p>
                <button
                  onClick={fetchPageData}
                  className={`px-4 py-2 rounded ${theme.button}`}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !page || !project ? (
            <div className="flex items-center justify-center h-full">
              <p className={theme.text}>Page not found</p>
            </div>
          ) : (
            <div className="p-6 h-full">
              <div className="h-full">
                <MarkdownPreview
                  content={page.content || ''}
                  isEditing={isEditing}
                  onSave={handleContentSave}
                  onCancel={handleEditCancel}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
