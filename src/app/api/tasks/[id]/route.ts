// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/lib/auth';
import prisma from 'app/lib/prisma';

// Helper para obtener el ID de la tarea de los parámetros de la URL
function getTaskId(params: { id: string }): number | null {
  const taskId = parseInt(params.id, 10);
  return isNaN(taskId) ? null : taskId;
}

// --- Método GET: Obtener una sola tarea (útil para la edición si se carga por ID) ---
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const taskId = getTaskId(params);

  if (taskId === null) {
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: userId, // Asegura que solo el propietario pueda ver la tarea
      },
    });

    if (!task) {
      return NextResponse.json({ message: 'Tarea no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/tasks/${taskId}: Error al obtener la tarea:`, error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}

// --- Método PUT: Actualizar una tarea existente ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const taskId = getTaskId(params);

  if (taskId === null) {
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, is_completed } = body;

    // Validaciones básicas (puedes expandirlas)
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'El título de la tarea es obligatorio.' }, { status: 400 });
    }
    if (description !== null && description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ message: 'La descripción debe ser una cadena de texto o nula.' }, { status: 400 });
    }
    if (dueDate !== null && dueDate !== undefined && typeof dueDate !== 'string') {
      return NextResponse.json({ message: 'La fecha de vencimiento debe ser una cadena de texto ISO o nula.' }, { status: 400 });
    }
    if (is_completed !== null && is_completed !== undefined && typeof is_completed !== 'boolean') {
      return NextResponse.json({ message: 'El estado de completado debe ser un booleano.' }, { status: 400 });
    }

    // Asegurarse de que la tarea pertenezca al usuario antes de actualizar
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Tarea no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        due_date: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        is_completed: is_completed,
        // updatedAt se actualiza automáticamente por @updatedAt en Prisma
      },
    });

    return NextResponse.json({
      message: 'Tarea actualizada con éxito',
      task: updatedTask,
    }, { status: 200 });

  } catch (error) {
    console.error(`PUT /api/tasks/${taskId}: Error al actualizar la tarea:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}

// --- Método DELETE: Eliminar una tarea ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const taskId = getTaskId(params);

  if (taskId === null) {
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    // Asegurarse de que la tarea pertenezca al usuario antes de eliminar
    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Tarea no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return NextResponse.json({ message: 'Tarea eliminada con éxito.' }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/tasks/${taskId}: Error al eliminar la tarea:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
