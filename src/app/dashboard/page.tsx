// app/dashboard/page.tsx
// NO 'use client'; aquí, para que sea un Server Component

import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
// Asegúrate de que la ruta sea correcta para tu auth.ts
// Si auth.ts está en 'src/lib', la ruta sería '@/lib/auth'
import { authOptions } from "app/lib/auth"; 

// Importa el nuevo componente cliente
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Si no hay sesión o usuario, redirige al login
  if (!session || !session.user) {
    redirect("/login"); // Redirige a tu página de login
  }

  // Pasa el objeto 'user' de la sesión al componente cliente
  return <DashboardClient user={session.user} />;
}
