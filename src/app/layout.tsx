// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Importa el nuevo componente cliente de proveedores
import { Providers } from './providers'; // Asegúrate de que la ruta sea correcta

// Importa las opciones de autenticación y getServerSession para usar en el Server Component
import { authOptions } from 'app/lib/auth'; // Asegúrate de que la ruta sea correcta para tu auth.ts
import { getServerSession } from 'next-auth';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindfulTask",
  description: "Task management app with a focus on mindfulness and productivity",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obtenemos la sesión en el servidor
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Renderiza el componente cliente Providers y pásale la sesión */}
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
