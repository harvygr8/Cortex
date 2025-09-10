import useThemeStore from '../../lib/stores/themeStore';

export default function LoadingSpinner() {
  const { isDarkMode, colors } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-current ${theme.text}`}></div>
    </div>
  );
} 