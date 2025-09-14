'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Edit } from 'lucide-react';
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
            { label: project?.title || 'Project', path: '/' },
            { label: page?.title || 'Loading...' }
          ]} 
        />
        {/* Fixed overlay buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className={`p-3 rounded-lg shadow-lg ${theme.button} hover:opacity-80 transition-opacity `}
              title="Cancel Edit"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`p-3 rounded-lg shadow-lg ${theme.button} hover:opacity-80 transition-opacity `}
              title="Edit Page"
            >
              <Edit className="w-5 h-5" />
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