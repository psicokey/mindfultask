
import { redirect } from 'next/navigation';
import DashboardHeader from 'app/components/dashboard/DashboardHeader';
import TaskSummary from 'app/components/dashboard/TaskSummary';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer'
import { getServerSession } from "next-auth";
import { authOptions } from "app/app/api/auth/[...nextauth]/route";


export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // El middleware ya debería proteger esta ruta, pero esta es una
  // salvaguarda adicional y nos da acceso al objeto session.
  if (!session || !session.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TaskSummary userId={parseInt(user.id, 10)} />
          </div>
          <div>
          <section className="col-span-1 row-span-1">
            <PomodoroTimer />
          </section>
            
          </div>
        </div>
      </main>
    </div>
  );
}