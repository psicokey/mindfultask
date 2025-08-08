// app/dashboard/layout.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/lib/auth'; // Ajusta la ruta de importación si es necesario
import { redirect } from 'next/navigation';
import DashboardLayoutClient from 'app/components/dashboard/DashboardLayoutClient'; // Importa el layout de cliente

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Pasa la sesión del usuario al componente de layout de cliente
  return (
    <DashboardLayoutClient user={session.user}>
      {children}
    </DashboardLayoutClient>
  );
}
