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
  const [isPreview, setIsPreview] = useState(false);

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
      <div className="mb-8 flex justify-between items-center">
        <Breadcrumb items={breadcrumbItems} />
        <div className={`flex rounded-lg overflow-hidden border ${
          isDarkMode ? 'border-neutral-700' : 'border-neutral-200'
        }`}>
          <button
            onClick={() => setIsPreview(false)}
            className={`px-4 py-1.5 text-sm transition-colors flex items-center gap-2 ${
              !isPreview 
                ? isDarkMode 
                  ? theme.dark.text
                  : theme.light.accent
                : isDarkMode 
                  ? 'text-neutral-600'
                  : theme.light.text
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            Edit
          </button>
          <button
            onClick={() => setIsPreview(true)}
            className={`px-4 py-1.5 text-sm transition-colors flex items-center gap-2 ${
              isPreview 
                ? isDarkMode 
                  ? theme.dark.text
                  : theme.light.accent
                : isDarkMode 
                  ? 'text-neutral-600'
                  : theme.light.text
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
            Preview
          </button>
        </div>
      </div>

      <div className={`rounded-lg p-6 ${isDarkMode ? theme.dark.background2 : theme.light.background2}`}>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full text-3xl font-bold font-figtree bg-transparent focus:outline-none ${
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
          isPreview={isPreview}
        />
      </div>
    </div>
  );
} 