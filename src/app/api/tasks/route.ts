// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'app/lib/auth'; // Ruta corregida
import prisma from 'app/lib/prisma'; // Ruta corregida
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  console.log('API /api/tasks (POST) ha sido llamada.');

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn('POST /api/tasks: Intento no autorizado.');
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    console.error('POST /api/tasks: userId inválido de la sesión:', session.user.id);
    return NextResponse.json({ message: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      console.warn('POST /api/tasks: Título de tarea obligatorio no proporcionado.');
      return NextResponse.json({ message: 'El título de la tarea es obligatorio.' }, { status: 400 });
    }
    if (description !== null && description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ message: 'La descripción debe ser una cadena de texto o nula.' }, { status: 400 });
    }
    if (dueDate !== null && dueDate !== undefined && typeof dueDate !== 'string') {
      return NextResponse.json({ message: 'La fecha de vencimiento debe ser una cadena de texto ISO o nula.' }, { status: 400 });
    }

    const dataToCreate: any = {
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || 'medium',
      userId: userId,
    };

    if (dueDate) {
      dataToCreate.due_date = new Date(dueDate);
    }

    const newTask = await prisma.task.create({
      data: dataToCreate,
    });

    console.log('POST /api/tasks: Tarea creada con éxito:', newTask.id);
    return NextResponse.json({
      message: 'Tarea creada con éxito',
      task: newTask,
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/tasks: Error al crear la tarea:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// Método GET para obtener tareas (ahora con filtros y paginación)
export async function GET(request: NextRequest) {
  console.log('API /api/tasks (GET) ha sido llamada.');

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    console.warn('GET /api/tasks: Intento no autorizado.');
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    console.error('GET /api/tasks: userId inválido de la sesión:', session.user.id);
    return NextResponse.json({ message: 'ID de usuario inválido.' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const filterPriority = searchParams.get('priority');
    const filterDueDate = searchParams.get('dueDate');
    const filterIsCompleted = searchParams.get('isCompleted'); // Correcto: 'isCompleted'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortField = searchParams.get('sortField') || 'createdAt'; // Correcto: 'sortField'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Correcto: 'sortOrder'

    const skip = (page - 1) * limit;

    const whereClause: Prisma.TaskWhereInput = {
      userId: userId,
    };

    // Filtrar por búsqueda de texto (título o descripción)
    if (searchQuery) {
      // No usar .toLowerCase() aquí, Prisma ya lo maneja con 'insensitive' si la DB lo soporta
      // o se basa en la intercalación de la columna.
      whereClause.OR = [
        { title: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ];
    }

    // Filtrar por prioridad
    if (filterPriority && ['low', 'medium', 'high'].includes(filterPriority)) {
      whereClause.priority = filterPriority;
    }

    // Filtrar por estado de completado
    if (filterIsCompleted === 'true') {
      whereClause.is_completed = true;
    } else if (filterIsCompleted === 'false') {
      whereClause.is_completed = false;
    }

    // Filtrar por fecha de vencimiento
    if (filterDueDate) {
      const date = new Date(filterDueDate);
      if (!isNaN(date.getTime())) {
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        whereClause.due_date = {
          gte: startOfDay,
          lt: endOfDay,
        };
      } else {
        console.warn(`GET /api/tasks: Fecha de vencimiento inválida proporcionada: ${filterDueDate}`);
      }
    }

    // Construir el objeto de ordenación dinámicamente
    const orderByClause: Prisma.TaskOrderByWithRelationInput = {};
    const validSortFields = ['createdAt', 'due_date', 'title', 'priority', 'is_completed'];
    if (validSortFields.includes(sortField)) {
      // Asignar el campo y el orden dinámicamente
      orderByClause[sortField as keyof Prisma.TaskOrderByWithRelationInput] = sortOrder as 'asc' | 'desc';
    } else {
      // Valor por defecto si el campo de ordenación no es válido
      orderByClause.createdAt = 'desc';
    }

    const [tasks, totalTasks] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        orderBy: orderByClause, // Usar el objeto de ordenación dinámico
        skip: skip,
        take: limit,
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    console.log(`GET /api/tasks: Se encontraron ${tasks.length} tareas (de ${totalTasks} totales) para el usuario ${userId} con filtros. Página ${page}, Límite ${limit}.`);
    return NextResponse.json({ tasks, totalTasks, page, limit }, { status: 200 });

  } catch (error) {
    console.error('GET /api/tasks: Error al obtener las tareas:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: `Error interno del servidor: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
