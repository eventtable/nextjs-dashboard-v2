import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers';

export const metadata: Metadata = {
  title: 'Aktien-Börsenprofi – Matrix 2.0',
  description: 'Professionelle Aktienanalyse mit KI-Unterstützung',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0e1a] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
