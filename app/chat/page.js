'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '../../lib/stores/projectStore';
import useThemeStore from '../../lib/stores/themeStore';
import Breadcrumb from '../components/Breadcrumb';
import Loader from '../components/Loader';
import ChatLoader from '../components/ChatLoader';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  const { isDarkMode, theme } = useThemeStore();

  useEffect(() => {
    if (!activeProjectId) {
      router.push('/');
      return;
    }

    const initializeChat = async () => {
      setIsInitializing(true);
      try {
        // First fetch project data
        const projectRes = await fetch(`/api/projects/${activeProjectId}`);
        const projectData = await projectRes.json();
        if (!projectData) throw new Error('Project not found');
        setProject(projectData);

        // Then initialize vector store and wait for completion
        const vectorRes = await fetch(`/api/projects/${activeProjectId}/vectors`, {
          method: 'POST'
        });
        const vectorData = await vectorRes.json();
        
        if (!vectorData.success) {
          throw new Error('Failed to initialize AI context');
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(err.message);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [activeProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Add temporary loading message
    setMessages(prev => [...prev, { type: 'loading' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          projectId: activeProjectId 
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const messageContent = data.answer || 'No response received';
      
      // Remove loading message and add AI response
      setMessages(prev => prev.filter(msg => msg.type !== 'loading').concat({
        type: 'assistant',
        content: messageContent
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove loading message and add error message
      setMessages(prev => prev.filter(msg => msg.type !== 'loading').concat({
        type: 'assistant',
        content: 'Sorry, there was an error processing your question.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    {
      label: project?.title,
      path: `/projects/${activeProjectId}`
    },
    {
      label: 'Chat'
    }
  ];

  if (!project || isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader text={isInitializing ? "Initializing AI context..." : "Loading project"} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className={`text-red-500 text-lg`}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className={`px-4 py-2 rounded-lg ${isDarkMode ? theme.dark.primary : theme.light.primary}`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col p-4">
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 rounded-lg shadow mb-4 ${
        isDarkMode ? theme.dark.background2 : theme.light.background2
      }`}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'loading' ? (
              <ChatLoader />
            ) : (
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? `${theme.dark.primary} text-white`
                    : `${isDarkMode ? theme.dark.background : theme.light.background} ${isDarkMode ? theme.dark.text : theme.light.text}`
                }`}
              >
                {message.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your project..."
          className={`flex-1 px-4 py-2 border rounded-lg ${
            isDarkMode 
              ? `${theme.dark.background2} ${theme.dark.border} ${theme.dark.text} placeholder-stone-500` 
              : `${theme.light.background2} ${theme.light.border} ${theme.light.text} placeholder-stone-400`
          } focus:ring-2 focus:ring-amber-500`}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded-lg transition-opacity ${
            isDarkMode ? theme.dark.primary : theme.light.primary
          } ${isDarkMode ? theme.dark.hover.primary : theme.light.hover.primary} disabled:opacity-40`}
        >
          Send
        </button>
      </form>
    </div>
  );
} 