import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Laptop Builder Dashboard',
  description: 'Real-time monitoring dashboard for secure AI-powered app building',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-darker text-gray-100">{children}</body>
    </html>
  );
}
