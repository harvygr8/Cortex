'use client';

import useThemeStore from '../../lib/stores/themeStore';

export default function ChatLoader() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <div className="flex justify-start">
      <div className={`max-w-[75%] rounded-lg p-3 ${theme.chatBubble.ai}`}>
        <div className="flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 