'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useProjectStore from '../../../../../lib/stores/projectStore';
import useThemeStore from '../../../../../lib/stores/themeStore';
import MarkdownPreview from '../../../../components/MarkdownPreview';
import DeletePageButton from '../../../../components/DeletePageButton';
import Loader from '../../../../components/Loader';
import PageLoader from '../../../../components/PageLoader';
import Breadcrumb from '../../../../components/Breadcrumb';

export default function PageDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;
  const pageId = params.pageId;
  const [page, setPage] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (projectId && pageId) {
      setActiveProjectId(projectId);
      fetchPageData();
    }
  }, [projectId, pageId, setActiveProjectId]);

  const fetchPageData = async () => {
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
    router.push('/');
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <div className="text-center">
          <p className={`text-lg mb-4 ${theme.text}`}>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded ${theme.button}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!page || !project) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <p className={theme.text}>Page not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      <div className="px-8 pt-6 pl-12 pb-20">
        <Breadcrumb 
          items={[
            { label: 'Projects', path: '/' },
            { label: project?.title || 'Loading...', path: `/projects/${projectId}` },
            { label: page?.title || 'Loading...' }
          ]} 
        />
        {/* Fixed overlay buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-2 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-lg p-1">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className={`p-3 rounded-lg shadow-lg ${theme.button} hover:opacity-80 transition-opacity backdrop-blur-sm`}
              title="Cancel Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`p-3 rounded-lg shadow-lg ${theme.button} hover:opacity-80 transition-opacity backdrop-blur-sm`}
              title="Edit Page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {!isEditing && (
            <DeletePageButton pageId={pageId} projectId={projectId} onPageDeleted={handlePageDeleted} />
          )}
        </div>

        <div className="mb-8">
          <div className="my-8 border-b border-gray-300 dark:border-gray-600" />

          <div className="mb-6">
            <MarkdownPreview
              content={page.content || ''}
              isEditing={isEditing}
              onSave={handleContentSave}
              onCancel={handleEditCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 