// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/auth";
import { prisma } from "app/lib/prisma";
import { Prisma } from "@prisma/client"; // Para tipos de Prisma

interface RouteParams {
  params: {
    id: string;
  };
}

// ==========================
// GET /api/tasks/[id]
// ==========================
export async function GET(request: NextRequest, context: RouteParams) {
  const { params } = context;
  console.log(`API /api/tasks/${params.id} (GET) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(params.id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (task.userId !== session.user.id) {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: `Error interno: ${
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
export async function PUT(request: NextRequest, context: RouteParams) {
  const { params } = context;
  console.log(`API /api/tasks/${params.id} (PUT) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(params.id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, is_completed } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!existingTask) {
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    const dataToUpdate: Prisma.TaskUpdateInput = {
      title: title?.trim(),
      description: description?.trim() ?? null,
      priority,
      is_completed,
      due_date: dueDate
        ? new Date(dueDate)
        : dueDate === null
        ? null
        : existingTask.due_date,
    };

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    return NextResponse.json(
      { message: "Tarea actualizada", task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: `Error interno: ${
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
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { params } = context;
  console.log(`API /api/tasks/${params.id} (DELETE) llamada.`);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const taskId = parseInt(params.id, 10);
  if (isNaN(taskId)) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!existingTask) {
      return NextResponse.json(
        { message: "Tarea no encontrada." },
        { status: 404 }
      );
    }

    if (existingTask.userId !== session.user.id) {
      return NextResponse.json({ message: "No autorizado." }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: "Tarea eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: `Error interno: ${
          error instanceof Error ? error.message : "Desconocido"
        }`,
      },
      { status: 500 }
    );
  }
}
