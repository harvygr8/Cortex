// Font utility functions for consistent font usage across components
import useThemeStore from '../stores/themeStore';

// Helper function to get font classes
export const getFontClasses = () => {
  const { fonts } = useThemeStore();
  return fonts;
};

// Predefined font class combinations for common use cases
export const fontClasses = {
  // Headings
  h1: 'text-3xl font-semibold',
  h2: 'text-2xl font-semibold', // Reduced from font-bold to font-semibold
  h3: 'text-xl font-semibold',  // Reduced from font-bold to font-semibold
  h4: 'text-lg font-semibold',  // Reduced from font-bold to font-semibold
  h5: 'text-base font-semibold',
  h6: 'text-sm font-semibold',
  
  // Body text
  body: 'text-base font-normal',
  bodyLarge: 'text-lg font-normal',
  bodySmall: 'text-sm font-normal',
  
  // Labels and UI text
  label: 'text-sm font-semibold', // Reduced from font-bold to font-semibold
  button: 'text-sm font-semibold',
  caption: 'text-xs font-normal',
  
  // Special cases
  logo: 'text-2xl font-semibold',
  nav: 'text-base font-semibold'
};

// Function to combine font classes with theme fonts
export const combineFontClasses = (baseClasses: string, fontType: string = 'primary') => {
  const fonts = getFontClasses();
  const fontClass = fonts[fontType as keyof typeof fonts] || fonts.primary;
  return `${baseClasses} ${fontClass}`;
};

// Convenience functions for common patterns
export const getHeadingClasses = (level: keyof typeof fontClasses = 'h1', fontType: string = 'heading') => {
  return combineFontClasses(fontClasses[level], fontType);
};

export const getBodyClasses = (size: keyof typeof fontClasses = 'body', fontType: string = 'body') => {
  return combineFontClasses(fontClasses[size], fontType);
};

export const getLabelClasses = (fontType: string = 'label') => {
  return combineFontClasses(fontClasses.label, fontType);
};
