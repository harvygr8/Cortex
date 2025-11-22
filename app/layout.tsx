import './globals.css';
import { Inter } from 'next/font/google';
import Sidebar from './components/Sidebar';
import ThemeWrapper from './components/ThemeWrapper';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Metadata } from 'next';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Cortex - AI-Enhanced Knowledge Hub',
  description: 'Local, AI-powered knowledge management system',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getThemePreference() {
                  const saved = localStorage.getItem('theme');
                  if (saved) return saved;
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                const theme = getThemePreference();
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <TooltipProvider>
          <ThemeWrapper>
            <Sidebar />
            <main className="ml-16">
              {children}
            </main>
          </ThemeWrapper>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
} 