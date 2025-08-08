// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/auth";
import { Prisma } from "@prisma/client";
import { prisma } from "app/lib/prisma";

// Tipos de Prisma
type TaskCreateInput = Prisma.TaskCreateInput;
type TaskWhereInput = Prisma.TaskWhereInput;
type TaskOrderByWithRelationInput = Prisma.TaskOrderByWithRelationInput;

export async function POST(request: NextRequest) {
  console.log("API /api/tasks (POST) llamada.");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { title, description, dueDate, priority } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { message: "El título de la tarea es obligatorio." },
        { status: 400 }
      );
    }

    const dataToCreate: TaskCreateInput = {
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || "medium",
      user: { connect: { id: userId } },
    };

    if (dueDate) {
      dataToCreate.due_date = new Date(dueDate);
    }

    const newTask = await prisma.task.create({ data: dataToCreate });

    return NextResponse.json(
      { message: "Tarea creada con éxito", task: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/tasks:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log("API /api/tasks (GET) llamada.");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const filterPriority = searchParams.get("priority");
    const filterDueDate = searchParams.get("dueDate");
    const filterIsCompleted = searchParams.get("isCompleted");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const whereClause: TaskWhereInput = { userId };

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ];
    }

    if (filterPriority && ["low", "medium", "high"].includes(filterPriority)) {
      whereClause.priority = filterPriority;
    }

    if (filterIsCompleted === "true") whereClause.is_completed = true;
    else if (filterIsCompleted === "false") whereClause.is_completed = false;

    if (filterDueDate) {
      const date = new Date(filterDueDate);
      if (!isNaN(date.getTime())) {
        whereClause.due_date = {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(24, 0, 0, 0)),
        };
      }
    }

    const orderByClause: TaskOrderByWithRelationInput = {};
    const validSortFields = [
      "createdAt",
      "due_date",
      "title",
      "priority",
      "is_completed",
    ];
    if (validSortFields.includes(sortField)) {
      orderByClause[sortField as keyof TaskOrderByWithRelationInput] =
        sortOrder as "asc" | "desc";
    } else {
      orderByClause.createdAt = "desc";
    }

    const [tasks, totalTasks] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    return NextResponse.json(
      { tasks, totalTasks, page, limit },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en GET /api/tasks:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
