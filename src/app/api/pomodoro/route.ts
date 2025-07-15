// app/api/pomodoro/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from 'app/app/api/auth/[...nextauth]/route';
import prisma from 'app/lib/prisma'; // Asegúrate de que la ruta sea correcta

export async function POST(request: Request) {
  // 1. Obtener la sesión del usuario para asegurar que esté autenticado
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    // 2. Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { duration, cycles_completed } = body;

    // 3. Validar los datos recibidos
    if (typeof duration !== 'number' || typeof cycles_completed !== 'number' || duration <= 0 || cycles_completed <= 0) {
      return NextResponse.json({ message: 'Datos inválidos' }, { status: 400 });
    }

    // 4. Crear el registro en la base de datos, pasando el objeto 'data'
    const newPomodoroSession = await prisma.pomodoroSession.create({
      data: {
        userId: parseInt(session.user.id, 10), // El ID de la sesión es string, la BD espera un número
        duration: Math.round(duration), // Guarda la duración en segundos
        cycles_completed: cycles_completed,
      },
    });

    // 5. Devolver una respuesta exitosa
    return NextResponse.json(newPomodoroSession, { status: 201 });

  } catch (error) {
    console.error("Error al crear la sesión Pomodoro:", error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
