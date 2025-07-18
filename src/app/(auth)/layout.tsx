import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeSwitcher from "app/components/ThemeSwitcher";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MindfulTask",
    template: "%s | MindfulTask"
  },
  description: "Task management app with a focus on mindfulness and productivity",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
    <main className={`min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-geist-sans ${geistSans.variable} ${geistMono.variable}`}>
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            MindfulTask
          </Link>
          <ThemeSwitcher />
          
        </div>
      </header>
      {children}
    </main>
  );
}