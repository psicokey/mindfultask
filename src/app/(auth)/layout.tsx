import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeSwitcher from "app/components/ThemeSwitcher";

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
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>
        {children}
      </div>
    </main>
  );
}