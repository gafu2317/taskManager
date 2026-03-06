import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from '@/components/providers/SessionProvider';
import LoginButton from '@/components/auth/LoginButton';
import PointsDisplay from '@/components/layout/PointsDisplay';

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "700"],
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
        className={`${zenKaku.variable} antialiased`}
      >
        <AuthSessionProvider>
          <div className="flex flex-col h-screen">
            <header className="bg-ink shrink-0 border-b-4 border-aqua">
              <div className="max-w-7xl mx-auto px-4 py-4 relative flex justify-center items-center">
                <h1 className="text-2xl font-bold tracking-widest text-white">Task Manager</h1>
                <div className="absolute right-4 flex items-center gap-4">
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
