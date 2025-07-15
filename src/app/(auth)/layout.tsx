import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
    <main className={`min-h-screen bg-gray-50 ${geistSans.variable} ${geistMono.variable}`}>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </main>
  );
}