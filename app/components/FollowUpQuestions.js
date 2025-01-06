'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function FollowUpQuestions({ questions, onQuestionClick }) {
  const { isDarkMode, theme } = useThemeStore();
  
  if (!questions || questions.length === 0) return null;
  
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 min-w-min">
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(q.question)}
            className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isDarkMode ? theme.dark.extra : theme.light.extra
            } hover:border-opacity-40`}
          >
            {q.question}
          </button>
        ))}
      </div>
    </div>
  );
} 