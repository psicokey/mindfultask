// app/providers.tsx
'use client'; // ¡Muy importante! Indica que este es un componente de cliente

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { type Session } from 'next-auth'; // Importa el tipo Session

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null; // Acepta la sesión como prop
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    // Envuelve el ThemeProvider dentro del SessionProvider
    // para que los componentes dentro de ThemeProvider puedan acceder a la sesión
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}