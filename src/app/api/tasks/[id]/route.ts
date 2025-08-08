// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/auth";
import { prisma } from "app/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ==========================
// GET /api/tasks/[id]
// ==========================
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  console.log(`API /api/tasks/${id} (GET) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.warn(`GET /api/tasks/${id}: Intento no autorizado.`);
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    console.error(`GET /api/tasks/${id}: ID de tarea inválido: ${id}`);
    return NextResponse.json(
      { message: "ID de tarea inválido." },
      { status: 400 }
    );
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      console.warn(`GET /api/tasks/${id}: Tarea no encontrada.`);
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (task.userId !== session.user.id) {
      console.warn(`GET /api/tasks/${id}: Acceso denegado.`);
      return NextResponse.json(
        { message: "No autorizado para ver esta tarea." },
        { status: 403 }
      );
    }

    console.log(`GET /api/tasks/${id}: Tarea encontrada con éxito: ${task.id}`);
    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error(`GET /api/tasks/${id}: Error al obtener la tarea:`, error);
    return NextResponse.json(
      {
        message: `Error interno del servidor: ${
          error instanceof Error ? error.message : "Desconocido"
        }`,
      },
      { status: 500 }
    );
  }
}

// ==========================
// PUT /api/tasks/[id]
// ==========================
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  console.log(`API /api/tasks/${id} (PUT) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.warn(`PUT /api/tasks/${id}: Intento no autorizado.`);
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    console.error(`PUT /api/tasks/${id}: ID de tarea inválido: ${id}`);
    return NextResponse.json(
      { message: "ID de tarea inválido." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, is_completed } = body ?? {};

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!existingTask) {
      console.warn(`PUT /api/tasks/${id}: Tarea no encontrada.`);
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      console.warn(`PUT /api/tasks/${id}: Acceso denegado.`);
      return NextResponse.json(
        { message: "No autorizado para actualizar esta tarea." },
        { status: 403 }
      );
    }

    // Construimos solo las propiedades que vienen en el body (evitamos poner undefined)
    const dataToUpdate: Prisma.TaskUpdateInput = {};

    if (title !== undefined)
      dataToUpdate.title = typeof title === "string" ? title.trim() : title;
    if (description !== undefined)
      dataToUpdate.description = description
        ? String(description).trim()
        : null;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (is_completed !== undefined) dataToUpdate.is_completed = is_completed;
    if (dueDate !== undefined) {
      dataToUpdate.due_date = dueDate ? new Date(dueDate) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    console.log(
      `PUT /api/tasks/${id}: Tarea actualizada con éxito: ${updatedTask.id}`
    );
    return NextResponse.json(
      { message: "Tarea actualizada con éxito", task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PUT /api/tasks/${id}: Error al actualizar la tarea:`, error);
    return NextResponse.json(
      {
        message: `Error interno del servidor: ${
          error instanceof Error ? error.message : "Desconocido"
        }`,
      },
      { status: 500 }
    );
  }
}

// ==========================
// DELETE /api/tasks/[id]
// ==========================
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  console.log(`API /api/tasks/${id} (DELETE) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.warn(`DELETE /api/tasks/${id}: Intento no autorizado.`);
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    console.error(`DELETE /api/tasks/${id}: ID de tarea inválido: ${id}`);
    return NextResponse.json(
      { message: "ID de tarea inválido." },
      { status: 400 }
    );
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!existingTask) {
      console.warn(`DELETE /api/tasks/${id}: Tarea no encontrada.`);
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      console.warn(`DELETE /api/tasks/${id}: Acceso denegado.`);
      return NextResponse.json(
        { message: "No autorizado para eliminar esta tarea." },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id: taskId } });

    console.log(
      `DELETE /api/tasks/${id}: Tarea eliminada con éxito: ${taskId}`
    );
    return NextResponse.json(
      { message: "Tarea eliminada con éxito." },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `DELETE /api/tasks/${id}: Error al eliminar la tarea:`,
      error
    );
    return NextResponse.json(
      {
        message: `Error interno del servidor: ${
          error instanceof Error ? error.message : "Desconocido"
        }`,
      },
      { status: 500 }
    );
  }
}
