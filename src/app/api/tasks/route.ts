// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "app/lib/auth"; // Asegúrate de que la ruta sea correcta
import { Prisma } from "@prisma/client";
import { prisma } from "app/lib/prisma";

// Para los tipos:
type TaskCreateInput = Prisma.TaskCreateInput;
type TaskWhereInput = Prisma.TaskWhereInput;
type TaskOrderByWithRelationInput = Prisma.TaskOrderByWithRelationInput;

export async function POST(request: NextRequest) {
  console.log("API /api/tasks (POST) ha sido llamada.");

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn("POST /api/tasks: Intento no autorizado.");
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // userId ahora es un String
  const userId = session.user.id;
  // No necesitas parseInt(userId) aquí si userId en Prisma es String

  try {
    const body = await request.json();
    const { title, description, dueDate, priority } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      console.warn(
        "POST /api/tasks: Título de tarea obligatorio no proporcionado."
      );
      return NextResponse.json(
        { message: "El título de la tarea es obligatorio." },
        { status: 400 }
      );
    }
    if (
      description !== null &&
      description !== undefined &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        { message: "La descripción debe ser una cadena de texto o nula." },
        { status: 400 }
      );
    }
    if (
      dueDate !== null &&
      dueDate !== undefined &&
      typeof dueDate !== "string"
    ) {
      return NextResponse.json(
        {
          message:
            "La fecha de vencimiento debe ser una cadena de texto ISO o nula.",
        },
        { status: 400 }
      );
    }

    const dataToCreate: TaskCreateInput = {
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || "medium",
      user: { connect: { id: userId } }, // Relación correcta con el usuario
    };

    if (dueDate) {
      dataToCreate.due_date = new Date(dueDate);
    }

    const newTask = await prisma.task.create({
      data: dataToCreate,
    });

    console.log("POST /api/tasks: Tarea creada con éxito:", newTask.id);
    return NextResponse.json(
      {
        message: "Tarea creada con éxito",
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tasks: Error al crear la tarea:", error as Error);
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

export async function GET(request: NextRequest) {
  console.log("API /api/tasks (GET) ha sido llamada.");

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn("GET /api/tasks: Intento no autorizado.");
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  // userId ahora es un String
  const userId = session.user.id;
  // No necesitas parseInt(userId) aquí

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

    const whereClause: TaskWhereInput = {
      userId: userId, // userId es String
    };

    if (searchQuery) {
      whereClause.OR = [
        { title: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ];
    }

    if (filterPriority && ["low", "medium", "high"].includes(filterPriority)) {
      whereClause.priority = filterPriority;
    }

    if (filterIsCompleted === "true") {
      whereClause.is_completed = true;
    } else if (filterIsCompleted === "false") {
      whereClause.is_completed = false;
    }

    if (filterDueDate) {
      const date = new Date(filterDueDate);
      if (!isNaN(date.getTime())) {
        const startOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const endOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1
        );

        whereClause.due_date = {
          gte: startOfDay,
          lt: endOfDay,
        };
      } else {
        console.warn(
          `GET /api/tasks: Fecha de vencimiento inválida proporcionada: ${filterDueDate}`
        );
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
        skip: skip,
        take: limit,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    console.log(
      `GET /api/tasks: Se encontraron ${tasks.length} tareas (de ${totalTasks} totales) para el usuario ${userId} con filtros. Página ${page}, Límite ${limit}.`
    );
    return NextResponse.json(
      { tasks, totalTasks, page, limit },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/tasks: Error al obtener las tareas:",
      error as Error
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
