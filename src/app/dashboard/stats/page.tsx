// app/dashboard/stats/page.tsx
import ProductivityStats from 'app/components/dashboard/ProductivityStats'; // Importa tu componente de estadísticas
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardStatsPage() {
  const session = await getServerSession(authOptions);

  // Redirige si el usuario no está autenticado
  if (!session || !session.user) {
    redirect('/login');
  }

  return (
    
          <ProductivityStats />

  );
}
