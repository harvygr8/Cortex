'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PageList from '../../components/PageList';
import NewPageButton from '../../components/NewPageButton';
import FileUpload from '../../components/FileUpload';
import useProjectStore from '../../../lib/stores/projectStore';
import useThemeStore from '../../../lib/stores/themeStore';
import Breadcrumb from '../../components/Breadcrumb';
import DeleteProjectButton from '../../components/DeleteProjectButton';

export default function ProjectPage() {
  const [project, setProject] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const params = useParams();
  const { isDarkMode, theme } = useThemeStore();
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);

  useEffect(() => {
    setActiveProjectId(params.projectId);
    fetchProject();
  }, [params.projectId]);

  const fetchProject = async () => {
    const response = await fetch(`/api/projects/${params.projectId}`);
    const data = await response.json();
    setProject(data);
    setTitle(data.title);
    setDescription(data.description);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${params.projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const updatedProject = await response.json();
      setProject(updatedProject);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Projects', path: '/' },
    { label: project?.title }
  ];

  if (!project) return (
    <p className={isDarkMode ? theme.dark.text : theme.light.text}>Loading...</p>
  );

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex justify-between items-start">
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`text-3xl font-bold w-full bg-transparent border-b ${
                    isDarkMode ? theme.dark.text : theme.light.text
                  }`}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full bg-transparent border rounded p-2 ${
                    isDarkMode ? theme.dark.text : theme.light.text
                  }`}
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-4 py-2 rounded ${isDarkMode ? theme.dark.accent : theme.light.accent}`}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setTitle(project.title);
                      setDescription(project.description);
                      setIsEditing(false);
                    }}
                    className={`px-4 py-2 rounded ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? theme.dark.text : theme.light.text}`}>
                  {project.title}
                </h1>
                <p className={isDarkMode ? theme.dark.secondary : theme.light.secondary}>
                  {project.description}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`mt-2 text-sm ${isDarkMode ? theme.dark.accent : theme.light.accent}`}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <DeleteProjectButton projectId={params.projectId} />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-semibold ${isDarkMode ? theme.dark.text : theme.light.text}`}>
          Pages
        </h2>
        <div className="flex gap-4">
          <FileUpload projectId={params.projectId} onFileProcessed={fetchProject} />
          <NewPageButton projectId={params.projectId} onPageCreated={fetchProject} />
        </div>
      </div>

      <PageList pages={project.pages || []} projectId={params.projectId} />
    </div>
  );
}