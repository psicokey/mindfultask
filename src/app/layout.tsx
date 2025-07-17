// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers"; // Asumo que ya tienes este Providers para NextAuth, etc.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MindfulTask",
  description: "Productividad con propósito",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Organiza tu trabajo, mejora tu productividad" />
        <meta name="keywords" content="productividad, organización, tareas, trabajo" />
        <meta name="author" content="MindfulTask Team" />
        <meta property="og:title" content="MindfulTask" />
        <meta property="og:description" content="Organiza tu trabajo, mejora tu productividad" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://mindfultask.com" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MindfulTask" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MindfulTask" />
        </head>
      <body className={inter.className}>
        <Providers session={null}> {/* Aquí deberías pasar la sesión real si la tienes */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
