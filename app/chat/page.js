'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useProjectStore from '../../lib/stores/projectStore';
import useThemeStore from '../../lib/stores/themeStore';
import Breadcrumb from '../components/Breadcrumb';
import Loader from '../components/Loader';
import ChatLoader from '../components/ChatLoader';
import SourceBadge from '../components/SourceBadge';
import FollowUpQuestions from '../components/FollowUpQuestions';

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
    
    console.log('[Chat] Sending message:', input);
    
    // Add loading message
    setMessages(prev => [...prev, { 
      type: 'loading'
    }]);

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

      // Replace loading message with assistant message
      setMessages(prev => {
        const newMessages = prev.slice(0, -1); // Remove loading message
        return [...newMessages, { 
          type: 'assistant', 
          content: '', 
          widgets: { sources: [], followUpQuestions: [] },
          streaming: true 
        }];
      });

      console.log('[Chat] Stream connected');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[Chat] Stream complete');
          break;
        }
        
        const chunk = decoder.decode(value);
        console.log('[Chat] Received chunk:', chunk);
        
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            console.log('[Chat] Processed data:', data);
            
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.type === 'assistant') {
                lastMessage.content = data.answer;
                lastMessage.widgets = data.widgets;
                lastMessage.streaming = !data.widgets.done;
              }
              return newMessages;
            });
          }
        }
      }
    } catch (error) {
      console.error('[Chat] Error:', error);
      // Remove loading message and add error message
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.type !== 'loading');
        return [...newMessages, {
          type: 'assistant',
          content: 'Sorry, there was an error processing your question.',
          widgets: { sources: [], followUpQuestions: [] }
        }];
      });
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
        <div className="scale-150">
          <ChatLoader />
        </div>
        <p className={`mt-4 ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
          {isInitializing ? "Initializing AI context" : "Loading project"}
        </p>
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
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col p-4">
      <div className="mb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      
      <div className={`flex-1 overflow-y-auto p-4 space-y-2 rounded-lg shadow mb-2 ${
        isDarkMode ? theme.dark.background2 : theme.light.background2
      }`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined mb-4 text-4xl" style={{ fontSize: '48px' }}>
              forum
            </span>
            <p className={`text-lg ${isDarkMode ? theme.dark.secondary : theme.light.secondary}`}>
              Ask a question about your project
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                {message.type === 'loading' ? (
                  <ChatLoader />
                ) : (
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? `${isDarkMode ? theme.dark.primary : theme.light.primary} text-white`
                        : `${isDarkMode ? theme.dark.background : theme.light.background} ${isDarkMode ? theme.dark.text : theme.light.text}`
                    }`}
                  >
                    <div>{message.content}</div>
                    
                    {message.type === 'assistant' && 
                     message.widgets?.sources?.length > 0 && 
                     message.widgets.sources.some(source => source.title && source.title.trim() !== '') && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.widgets.sources
                          .filter(source => source.title && source.title.trim() !== '')
                          .map((source, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-md text-white ${
                                isDarkMode 
                                  ? `${theme.dark.primary}`
                                  : `${theme.light.primary}`
                              }`}
                            >
                              {source.title}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && messages[messages.length - 1].widgets?.followUpQuestions?.length > 0 && (
        <div className="mb-2">
          <FollowUpQuestions 
            questions={messages[messages.length - 1].widgets.followUpQuestions}
            onQuestionClick={(question) => {
              setInput(question);
            }}
          />
        </div>
      )}

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
          }`}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`p-2 rounded-lg transition-opacity flex items-center justify-center ${
            isDarkMode ? theme.dark.primary : theme.light.primary
          } ${isDarkMode ? theme.dark.hover.primary : theme.light.hover.primary} disabled:opacity-40`}
          title="Send message"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            send
          </span>
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
} 