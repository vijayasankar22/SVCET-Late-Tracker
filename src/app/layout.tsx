import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'SVCET - Late Tracker',
  description: 'Late Student Tracker',
  icons: {
    icon: `https://firebasestorage.googleapis.com/v0/b/studio-4945559493-d87d9.firebasestorage.app/o/add.png?alt=media&token=b09b57a3-e533-4698-bec3-a1cbf27bef08`
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}>
          <AuthProvider>
            {children}
          </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
