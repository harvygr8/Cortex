import './globals.css';
import { Inter, PT_Sans, IBM_Plex_Sans } from 'next/font/google';
import Sidebar from './components/Sidebar';
import ThemeWrapper from './components/ThemeWrapper';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });
const ptSans = PT_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
  weight: ['400', '700'],
  style: ['normal', 'italic']
});

const ibmPlexSans = IBM_Plex_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic']
});

export const metadata = {
  title: 'Cortex - AI-Enhanced Knowledge Hub',
  description: 'Local, AI-powered knowledge management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${ptSans.variable} ${ibmPlexSans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={inter.className}>
        <ThemeWrapper>
          <Sidebar />
          <main className="ml-20">
            {children}
          </main>
        </ThemeWrapper>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
} 