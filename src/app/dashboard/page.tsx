import { verifyToken } from 'app/lib/auth';
import { getAuthCookie } from 'app/lib/auth';
import { redirect } from 'next/navigation';
import DashboardHeader from 'app/components/dashboard/DashboardHeader';
import TaskSummary from 'app/components/dashboard/TaskSummary';
import PomodoroTimer from 'app/components/dashboard/PomodoroTimer'
import PomodoroSection from 'app/components/dashboard/PomodoroSection';

export default async function Dashboard() {
  const token = getAuthCookie();
  const user = token ? verifyToken(token) : null;

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TaskSummary userId={user.id} />
          </div>
          <div>
          <section className="col-span-1 row-span-1">
            <PomodoroTimer compactMode />
          </section>
            <PomodoroSection userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}