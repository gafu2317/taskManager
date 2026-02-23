import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from '@/components/providers/SessionProvider';
import LoginButton from '@/components/auth/LoginButton';
import PointsDisplay from '@/components/layout/PointsDisplay';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A task management application with bubble visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <div className="flex flex-col h-screen">
            <header className="bg-blue-900 text-white shadow-md shrink-0">
              <div className="max-w-7xl mx-auto px-4 py-4 relative flex justify-center items-center">
                <h1 className="text-2xl font-bold">Task Manager</h1>
                <div className="absolute right-0 flex items-center gap-4">
                  <PointsDisplay />
                  <LoginButton />
                </div>
              </div>
            </header>
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
