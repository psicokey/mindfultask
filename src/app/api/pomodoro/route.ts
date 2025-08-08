// app/api/pomodoro/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/auth"; // Importa tus opciones de autenticación de NextAuth
import { prisma } from "../../../lib/prisma"; // Importa tu instancia de PrismaClient

export async function POST(request: NextRequest) {
  console.log("API /api/pomodoro (POST) ha sido llamada.");

  // 1. Obtener la sesión del usuario
  const session = await getServerSession(authOptions);

  // Verificar si el usuario está autenticado
  if (!session || !session.user || !session.user.id) {
    console.warn("POST /api/pomodoro: Intento no autorizado.");
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // userId ahora es un String (ya se actualizó en auth.ts y schema.prisma)
  const userId = session.user.id;

  try {
    // 2. Parsear el cuerpo de la solicitud
    // Ahora esperamos work_duration_seconds y break_duration_seconds
    const {
      duration, // Esta 'duration' es la duración total de la sesión (acumulada)
      cycles_completed,
      work_duration_seconds, // Nuevo campo esperado del frontend
      break_duration_seconds, // Nuevo campo esperado del frontend
    } = await request.json();

    // 3. Validar los datos recibidos
    if (typeof duration !== "number" || duration <= 0) {
      console.warn("POST /api/pomodoro: Duración total inválida.");
      return NextResponse.json(
        { message: "Duración total de sesión inválida." },
        { status: 400 }
      );
    }
    if (typeof cycles_completed !== "number" || cycles_completed < 0) {
      // Puede ser 0 si no se completó un ciclo completo
      console.warn("POST /api/pomodoro: Ciclos completados inválidos.");
      return NextResponse.json(
        { message: "Ciclos completados inválidos." },
        { status: 400 }
      );
    }
    if (
      typeof work_duration_seconds !== "number" ||
      work_duration_seconds < 0
    ) {
      console.warn("POST /api/pomodoro: Duración de trabajo inválida.");
      return NextResponse.json(
        { message: "Duración de trabajo inválida." },
        { status: 400 }
      );
    }
    if (
      typeof break_duration_seconds !== "number" ||
      break_duration_seconds < 0
    ) {
      console.warn("POST /api/pomodoro: Duración de descanso inválida.");
      return NextResponse.json(
        { message: "Duración de descanso inválida." },
        { status: 400 }
      );
    }

    // 4. Guardar la sesión en la base de datos usando Prisma
    const newPomodoroSession = await prisma.pomodoroSession.create({
      data: {
        userId: userId,
        duration: duration,
        work_duration_seconds: work_duration_seconds,
        break_duration_seconds: break_duration_seconds,
        cycles_completed: cycles_completed,
      },
    });

    console.log(
      "POST /api/pomodoro: Sesión Pomodoro guardada con éxito:",
      newPomodoroSession.id
    );
    return NextResponse.json(
      {
        message: "Sesión Pomodoro guardada con éxito",
        session: newPomodoroSession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/pomodoro: Error al guardar la sesión Pomodoro:",
      error
    );
    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Error interno del servidor: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
