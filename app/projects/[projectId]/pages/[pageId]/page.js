'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import useThemeStore from '../../../../../lib/stores/themeStore';
import useProjectStore from '../../../../../lib/stores/projectStore';
import Breadcrumb from '../../../../components/Breadcrumb';
import MarkdownPreview from '../../../../components/MarkdownPreview';

export default function PageView() {
  const [page, setPage] = useState(null);
  const [project, setProject] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const params = useParams();
  const { isDarkMode, theme } = useThemeStore();
  const setActiveProjectId = useProjectStore(state => state.setActiveProjectId);

  useEffect(() => {
    setActiveProjectId(params.projectId);
    fetchPageData();
  }, [params.projectId]);

  useEffect(() => {
    const saveTimer = setTimeout(handleSave, 1000);
    return () => clearTimeout(saveTimer);
  }, [title, content]);

  const fetchPageData = async () => {
    const [pageRes, projectRes] = await Promise.all([
      fetch(`/api/projects/${params.projectId}/pages/${params.pageId}`),
      fetch(`/api/projects/${params.projectId}`)
    ]);
    
    const [pageData, projectData] = await Promise.all([
      pageRes.json(),
      projectRes.json()
    ]);
    
    setPage(pageData);
    setProject(projectData);
    setTitle(pageData.title);
    setContent(pageData.content || '');
  };

  const handleSave = async () => {
    if (!title || !content || saving) return;
    setSaving(true);
    setSaveStatus('Saving...');
    
    try {
      const response = await fetch(
        `/api/projects/${params.projectId}/pages/${params.pageId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }
      );
      const updatedPage = await response.json();
      setPage(updatedPage);
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving page:', error);
      setSaveStatus('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    {
      label: project?.title,
      path: `/projects/${project?.id}`
    },
    {
      label: page?.title
    }
  ];

  if (!page || !project) return (
    <div className={isDarkMode ? theme.dark.text : theme.light.text}>Loading...</div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className={`rounded-lg p-6 ${isDarkMode ? theme.dark.background2 : theme.light.background2}`}>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full text-3xl font-bold bg-transparent focus:outline-none ${
              isDarkMode ? theme.dark.text : theme.light.text
            }`}
          />
          {saveStatus && (
            <span className={`absolute top-2 right-2 text-sm ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
              {saveStatus}
            </span>
          )}
        </div>
        
        <div className={`my-6 border-b ${isDarkMode ? theme.dark.border : theme.light.border}`} />
        
        <MarkdownPreview 
          content={content} 
          onChange={setContent}
        />
      </div>
    </div>
  );
} 