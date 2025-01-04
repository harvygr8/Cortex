'use client';

import { useRouter } from 'next/navigation';
import useThemeStore from '../../lib/stores/themeStore';

export default function Breadcrumb({ items }) {
  const router = useRouter();
  const { isDarkMode, theme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 mb-4">
      {items.map((item, index) => (
        <div key={item.path || index} className="flex items-center">
          {index > 0 && (
            <span className={`text-sm mx-2`}>
              /
            </span>
          )}
          {item.path ? (
            <button
              onClick={() => router.push(item.path)}
              className={`text-sm hover:underline focus:outline-none`}
            >
              {item.label}
            </button>
          ) : (
            <span className={`text-sm`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
} 