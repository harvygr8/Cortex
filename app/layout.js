import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import ThemeWrapper from './components/ThemeWrapper';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cortex - AI-Enhanced Knowledge Hub',
  description: 'Local, AI-powered knowledge management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeWrapper>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </ThemeWrapper>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
} 