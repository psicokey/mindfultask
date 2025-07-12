import { NextResponse } from 'next/server';
import { query } from 'app/lib/db';
import { verifyToken, getAuthCookie } from 'app/lib/auth';
import { Task } from 'app/types/task';

// GET - Obtener todas las tareas del usuario
export async function GET(request: Request) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Consulta para MariaDB 11
    const tasks = await query<Task[]>(`
      SELECT 
        id, 
        user_id, 
        title, 
        description, 
        due_date, 
        priority, 
        completed,
        created_at,
        updated_at
      FROM tasks 
      WHERE user_id = ?
      ORDER BY 
        CASE priority
          WHEN 'urgent-important' THEN 1
          WHEN 'notUrgent-important' THEN 2
          WHEN 'urgent-notImportant' THEN 3
          ELSE 4
        END,
        due_date ASC
    `, [user.id]);

    // Formatear fechas para el cliente
    const formattedTasks = tasks.map(task => ({
      ...task,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      created_at: new Date(task.created_at).toISOString(),
      updated_at: new Date(task.updated_at).toISOString(),
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva tarea
export async function POST(request: Request) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { title, description, due_date, priority, completed = false } = await request.json();

    if (!title || !priority) {
      return NextResponse.json(
        { message: 'Título y prioridad son requeridos' },
        { status: 400 }
      );
    }

    // Validar prioridad
    const validPriorities = ['urgent-important', 'notUrgent-important', 'urgent-notImportant', 'notUrgent-notImportant'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { message: 'Prioridad no válida' },
        { status: 400 }
      );
    }

    // Insertar en MariaDB 11
    const result = await query(`
      INSERT INTO tasks 
        (user_id, title, description, due_date, priority, completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      user.id,
      title,
      description,
      due_date ? new Date(due_date) : null,
      priority,
      completed
    ]);

    // Obtener la tarea recién creada
    const [newTask] = await query<Task[]>(`
      SELECT * FROM tasks WHERE id = LAST_INSERT_ID()
    `);

    return NextResponse.json({
      ...newTask,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
      created_at: new Date(newTask.created_at).toISOString(),
      updated_at: new Date(newTask.updated_at).toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar múltiples tareas (para reordenar, cambiar prioridades, etc.)
export async function PUT(request: Request) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { tasks: tasksToUpdate } = await request.json();

    if (!Array.isArray(tasksToUpdate)) {
      return NextResponse.json(
        { message: 'Formato de datos inválido' },
        { status: 400 }
      );
    }

    // MariaDB 11 permite múltiples actualizaciones en una sola transacción
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {
      for (const task of tasksToUpdate) {
        await conn.query(`
          UPDATE tasks 
          SET 
            title = ?,
            description = ?,
            due_date = ?,
            priority = ?,
            completed = ?
          WHERE id = ? AND user_id = ?
        `, [
          task.title,
          task.description,
          task.due_date ? new Date(task.due_date) : null,
          task.priority,
          task.completed,
          task.id,
          user.id
        ]);
      }

      await conn.commit();
      return NextResponse.json({ message: 'Tareas actualizadas correctamente' });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error updating tasks:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}