import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CPU Scheduling Visualizer — See how an OS shares the CPU',
  description:
    'A beginner-friendly, interactive simulator that shows how operating systems schedule processes using FCFS, SJF, SRTF, Priority, and Round Robin.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen`}>{children}</body>
    </html>
  );
}
