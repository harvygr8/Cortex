'use client';

import { useRouter } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';
import { getHeadingClasses, getBodyClasses } from '../../lib/utils/fontUtils';

export default function Breadcrumb({ items, showLargeTitle = true }: any) {
  const router = useRouter();
  const { isDarkMode, colors, fonts } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  return (
    <div className="flex items-center gap-1 mb-6">
      {items.map((item: any, index: any) => (
        <div key={item.path || index} className="flex items-center">
          {index > 0 && (
            <span className={`text-sm mx-2 ${theme.secondary}`}>
              /
            </span>
          )}
          {item.path ? (
            <button
              onClick={() => router.push(item.path)}
              className={`${getBodyClasses('body')} hover:underline focus:outline-none ${theme.text} hover:${theme.accent}`}
            >
              {item.label}
            </button>
          ) : (
            <span className={`${getBodyClasses('body')} font-semibold ${theme.text}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
} 