'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import useProjectStore from '../../../lib/stores/projectStore';
import useThemeStore from '../../../lib/stores/themeStore';
import PageList from '../../components/PageList';
import NewPageButton from '../../components/NewPageButton';
import FileUpload from '../../components/FileUpload';
import DeleteProjectButton from '../../components/DeleteProjectButton';
import RegenerateVectorsButton from '../../components/RegenerateVectorsButton';
import Loader from '../../components/Loader';
import PageLoader from '../../components/PageLoader';
import Breadcrumb from '../../components/Breadcrumb';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;
  const [project, setProject] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId);
      fetchProjectData();
    }
  }, [projectId, setActiveProjectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, pagesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/pages`)
      ]);

      if (!projectRes.ok || !pagesRes.ok) {
        throw new Error('Failed to fetch project data');
      }

      const [projectData, pagesData] = await Promise.all([
        projectRes.json(),
        pagesRes.json()
      ]);

      setProject(projectData);
      setPages(pagesData);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageCreated = () => {
    fetchProjectData();
  };

  const handleFileProcessed = () => {
    fetchProjectData();
  };

  const handleProjectDeleted = () => {
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
            className={`px-4 py-2 rounded ${theme.secondary}`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <p className={theme.text}>Project not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background}`}>
      <div className="px-8 pt-6 pl-12">
        <Breadcrumb 
          items={[
            { label: 'Projects', path: '/' },
            { label: project?.title || 'Loading...' }
          ]} 
        />
        <div className="mb-12">
          <div className="flex justify-between items-start mb-6">
            <div>
              {project?.description && (
                <p className={`text-lg ${theme.secondary} mb-4`}>
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <NewPageButton projectId={projectId} onPageCreated={handlePageCreated} />
              <DeleteProjectButton projectId={projectId} onProjectDeleted={handleProjectDeleted} />
              <FileUpload projectId={projectId} onFileProcessed={handleFileProcessed} />
              <RegenerateVectorsButton projectId={projectId} />
            </div>
          </div>

          <div className="mt-10 mb-4">
            <h2 className={`text-2xl font-semibold font-source-sans-3 ${theme.text}`}>
              Pages ({pages.length})
            </h2>
          </div>

          <PageList pages={pages} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}