// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/app/api/auth/[...nextauth]/route'; // Importa tus opciones de autenticación de NextAuth
import prisma from 'app/lib/prisma';
import { Prisma } from '@prisma/client';

// Nota: La función GET para /api/tasks (sin ID específico) está en el mismo archivo
// si no tienes un archivo separado para /api/tasks/route.ts.
// Si tienes un archivo separado, asegúrate de que este archivo solo contenga
// las operaciones para el ID específico (GET, PUT, DELETE).

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`API /api/tasks/${params.id} (GET) ha sido llamada.`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn(`GET /api/tasks/${params.id}: Intento no autorizado.`);
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = parseInt(params.id, 10); // Acceso directo a params.id

  if (isNaN(taskId)) {
    console.error(`GET /api/tasks/${params.id}: ID de tarea inválido: ${params.id}`);
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      console.warn(`GET /api/tasks/${params.id}: Tarea no encontrada.`);
      return NextResponse.json({ message: 'Tarea no encontrada.' }, { status: 404 });
    }

    // Asegurarse de que el usuario solo pueda ver sus propias tareas
    if (task.userId !== userId) {
      console.warn(`GET /api/tasks/${params.id}: Acceso denegado. El usuario ${userId} intentó acceder a la tarea de otro usuario (${task.userId}).`);
      return NextResponse.json({ message: 'No autorizado para ver esta tarea.' }, { status: 403 });
    }

    console.log(`GET /api/tasks/${params.id}: Tarea encontrada con éxito:`, task.id);
    return NextResponse.json(task, { status: 200 });

  } catch (error) {
    console.error(`GET /api/tasks/${params.id}: Error al obtener la tarea:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`API /api/tasks/${params.id} (PUT) ha sido llamada.`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn(`PUT /api/tasks/${params.id}: Intento no autorizado.`);
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = parseInt(params.id, 10); // Acceso directo a params.id

  if (isNaN(taskId)) {
    console.error(`PUT /api/tasks/${params.id}: ID de tarea inválido: ${params.id}`);
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, is_completed } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      console.warn(`PUT /api/tasks/${params.id}: Tarea no encontrada.`);
      return NextResponse.json({ message: 'Tarea no encontrada.' }, { status: 404 });
    }

    if (existingTask.userId !== userId) {
      console.warn(`PUT /api/tasks/${params.id}: Acceso denegado. El usuario ${userId} intentó actualizar la tarea de otro usuario (${existingTask.userId}).`);
      return NextResponse.json({ message: 'No autorizado para actualizar esta tarea.' }, { status: 403 });
    }

    const dataToUpdate: any = {
      title: title?.trim(),
      description: description ? description.trim() : null,
      priority: priority,
      is_completed: is_completed,
    };

    if (dueDate) {
      dataToUpdate.due_date = new Date(dueDate);
    } else if (dueDate === null) {
      dataToUpdate.due_date = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    console.log(`PUT /api/tasks/${params.id}: Tarea actualizada con éxito:`, updatedTask.id);
    return NextResponse.json({
      message: 'Tarea actualizada con éxito',
      task: updatedTask,
    }, { status: 200 });

  } catch (error) {
    console.error(`PUT /api/tasks/${params.id}: Error al actualizar la tarea:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`API /api/tasks/${params.id} (DELETE) ha sido llamada.`);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn(`DELETE /api/tasks/${params.id}: Intento no autorizado.`);
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = session.user.id;
  const taskId = parseInt(params.id, 10); // Acceso directo a params.id

  if (isNaN(taskId)) {
    console.error(`DELETE /api/tasks/${params.id}: ID de tarea inválido: ${params.id}`);
    return NextResponse.json({ message: 'ID de tarea inválido.' }, { status: 400 });
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      console.warn(`DELETE /api/tasks/${params.id}: Tarea no encontrada.`);
      return NextResponse.json({ message: 'Tarea no encontrada.' }, { status: 404 });
    }

    if (existingTask.userId !== userId) {
      console.warn(`DELETE /api/tasks/${params.id}: Acceso denegado. El usuario ${userId} intentó eliminar la tarea de otro usuario (${existingTask.userId}).`);
      return NextResponse.json({ message: 'No autorizado para eliminar esta tarea.' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    console.log(`DELETE /api/tasks/${params.id}: Tarea eliminada con éxito:`, taskId);
    return NextResponse.json({ message: 'Tarea eliminada con éxito.' }, { status: 200 });

  } catch (error) {
    console.error(`DELETE /api/tasks/${params.id}: Error al eliminar la tarea:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
