'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import useProjectStore from '../../lib/stores/projectStore';
import useThemeStore from '../../lib/stores/themeStore';
import ChatLoader from '../components/ChatLoader';
import Breadcrumb from '../components/Breadcrumb';
import SourceBadge from '../components/SourceBadge';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState(null);

  const messagesEndRef = useRef(null);
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (!activeProjectId) {
      router.push('/');
      return;
    }
    fetchProject();
    scrollToBottom();
  }, [messages, activeProjectId, router]);

  const fetchProject = async () => {
    if (!activeProjectId) return;
    
    try {
      const response = await fetch(`/api/projects/${activeProjectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      console.log('[Chat] Received API response:', data);
      console.log('[Chat] Sources from API:', data.widgets?.sources);
      
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.widgets?.sources || [],
        warning: data.warning || null,
        timestamp: new Date()
      };
      
      console.log('[Chat] Created AI message with sources:', aiMessage.sources);

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };



  if (!activeProjectId) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.background}`}>
        <p className={`text-lg ${theme.text}`}>No active project. Please select a project first.</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-[calc(100vh-0px)] ${theme.background} flex flex-col overflow-hidden`}>
      {/* Breadcrumb Section */}
      <div className="px-8 pt-6 pb-2">
        <Breadcrumb 
          items={[
            { label: 'Projects', path: '/' },
            { label: project?.title || 'Loading...', path: `/projects/${activeProjectId}` },
            { label: 'Chat' }
          ]} 
        />
      </div>

      {/* Chat Interface Section - Scrollable messages area */}
      <div className={`flex-1 mx-4 my-3 rounded-lg overflow-hidden ${theme.background1}`}>
        <div className="h-full flex flex-col">
          {/* Messages container with scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              // Empty state message
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className={`w-16 h-16 rounded-full shadow-md ${theme.background2} flex items-center justify-center mb-4`}>
                  <svg 
                    className={`w-8 h-8 ${theme.secondary}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                    />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold font-source-sans-3 mb-2 ${theme.text}`}>
                  Chat with your project
                </h3>
                <p className={`text-sm ${theme.secondary} max-w-md`}>
                  Ask questions about your project content below. I'll help you find the information you need.
                </p>
              </div>
            ) : (
              // Existing messages
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? `${theme.chatBubble.user}`
                        : `${theme.chatBubble.ai}`
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            // Custom styling for markdown elements with generous spacing and proper hierarchy
                            h1: ({ children }) => <h1 className="text-2xl font-semibold font-source-sans-3 mb-4 mt-6 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-semibold font-source-sans-3 mb-3 mt-5 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-semibold font-source-sans-3 mb-3 mt-4 first:mt-0">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-base font-semibold font-source-sans-3 mb-2 mt-3 first:mt-0">{children}</h4>,
                            h5: ({ children }) => <h5 className="text-sm font-semibold font-source-sans-3 mb-2 mt-2 first:mt-0">{children}</h5>,
                            h6: ({ children }) => <h6 className="text-sm font-semibold font-source-sans-3 mb-2 mt-2 first:mt-0">{children}</h6>,
                            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-sm">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-3 ml-3">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-3 ml-3">{children}</ol>,
                            li: ({ children }) => <li className="text-sm leading-relaxed py-1">{children}</li>,
                            code: ({ children, className }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                                  {children}
                                </code>
                              ) : (
                                <code className={className}>{children}</code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg overflow-x-auto text-sm mb-4 border border-gray-200 dark:border-gray-700 my-4">
                                {children}
                              </pre>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-5 italic mb-4 bg-gray-50 dark:bg-gray-900/50 py-3 rounded-r my-4">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-4 my-4">
                                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 bg-gray-100 dark:bg-gray-800 font-semibold text-sm">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm">
                                {children}
                              </td>
                            ),
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {children}
                              </a>
                            ),
                            hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    )}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.sources.map((source, idx) => (
                          <SourceBadge key={idx} source={source} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && <ChatLoader />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>



      {/* Chatbox Section - Compact height */}
      <div className={`h-20 p-4 ${theme.border} flex-shrink-0`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your project..."
              className={`flex-1 px-4 py-3 rounded-lg shadow-md text-sm ${theme.input} focus:outline-none focus:ring-2 ${theme.focusRing} focus:border-transparent`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`px-6 py-3 rounded-lg text-sm font-medium ${theme.button} disabled:opacity-50 hover:opacity-80 transition-opacity flex items-center gap-2`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                <>
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                    />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 