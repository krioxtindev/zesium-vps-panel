import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/layout-shell';

export const metadata: Metadata = {
  title: 'VPS Client Dashboard',
  description: 'Moderní klientský přehled pro správu VPS s Proxmox proxy backendem.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
