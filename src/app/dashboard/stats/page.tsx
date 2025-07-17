// app/dashboard/stats/page.tsx
import ProductivityStats from 'app/components/dashboard/ProductivityStats'; // Importa tu componente de estadísticas
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardStatsPage() {
  const session = await getServerSession(authOptions);

  // Redirige si el usuario no está autenticado
  if (!session || !session.user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto py-8">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800 dark:text-white">
          Tus Estadísticas de Productividad
        </h1>
        <div className="max-w-3xl mx-auto"> {/* Centrar y limitar el ancho del componente de estadísticas */}
          <ProductivityStats />
        </div>
      </main>
    </div>
  );
}
