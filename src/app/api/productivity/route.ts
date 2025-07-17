// app/api/productivity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/lib/auth';
import prisma from 'app/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  console.log('API /api/productivity (GET) ha sido llamada.');

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn('GET /api/productivity: Intento no autorizado.');
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    console.error('GET /api/productivity: userId inválido de la sesión:', session.user.id);
    return NextResponse.json({ message: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    // 1. Obtener estadísticas de tareas
    const totalTasks = await prisma.task.count({
      where: { userId: userId },
    });

    const completedTasks = await prisma.task.count({
      where: { userId: userId, is_completed: true },
    });

    // 2. Obtener estadísticas de sesiones Pomodoro
    const pomodoroSessions = await prisma.pomodoroSession.findMany({
      where: { userId: userId },
      select: {
        duration: true,
        cycles_completed: true,
      },
    });

    let totalPomodoroDurationSeconds = 0;
    let totalPomodoroCycles = 0;

    pomodoroSessions.forEach(session => {
      totalPomodoroDurationSeconds += session.duration;
      totalPomodoroCycles += session.cycles_completed;
    });

    const totalPomodoroDurationMinutes = Math.floor(totalPomodoroDurationSeconds / 60);

    // 3. Calcular la tendencia semanal de tareas completadas
    const weeklyTrend: number[] = new Array(7).fill(0); // [Lun, Mar, Mié, Jue, Vie, Sáb, Dom]
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    // Obtener tareas completadas en los últimos 7 días
    const tasksLast7Days = await prisma.task.findMany({
      where: {
        userId: userId,
        is_completed: true,
        // Filtrar por tareas completadas en los últimos 7 días (incluyendo hoy)
        updatedAt: {
          gte: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 días atrás desde hoy
        },
      },
      select: {
        updatedAt: true,
      },
    });

    tasksLast7Days.forEach(task => {
      const taskDate = new Date(task.updatedAt);
      taskDate.setHours(0, 0, 0, 0);

      // Calcular la diferencia en días desde hoy
      const diffTime = Math.abs(today.getTime() - taskDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Días de diferencia

      // El índice del día de la semana (0=Domingo, 1=Lunes, etc.)
      // Queremos que Lun sea el índice 0, Mar 1, etc.
      let dayOfWeek = taskDate.getDay(); // 0 (Domingo) a 6 (Sábado)
      dayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Convertir a 0=Lun, 6=Dom

      // Ajustar el índice para que el día actual sea el último en el array de 7 días
      // Y los días anteriores se mapeen correctamente
      const todayDayOfWeek = (today.getDay() === 0) ? 6 : today.getDay() - 1;
      const index = (dayOfWeek - todayDayOfWeek + 7) % 7;

      weeklyTrend[index]++;
    });

    console.log(`GET /api/productivity: Estadísticas generadas para el usuario ${userId}.`);

    return NextResponse.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalPomodoroSessions: pomodoroSessions.length,
      totalPomodoroDurationMinutes,
      totalPomodoroCycles,
      weeklyTrend, // Incluir la tendencia semanal
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/productivity: Error al obtener las estadísticas:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
