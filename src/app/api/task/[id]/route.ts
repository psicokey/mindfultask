import { NextResponse } from 'next/server';
import { query } from 'app/lib/db';
import { verifyToken, getAuthCookie } from 'app/lib/auth';
import { Task } from 'app/types/task';

// GET - Obtener una tarea específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const [task] = await query<Task[]>(`
      SELECT * FROM tasks 
      WHERE id = ? AND user_id = ?
    `, [params.id, user.id]);

    if (!task) {
      return NextResponse.json(
        { message: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...task,
      due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
      created_at: new Date(task.created_at).toISOString(),
      updated_at: new Date(task.updated_at).toISOString(),
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una tarea específica
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const { title, description, due_date, priority, completed } = await request.json();

    // Validar datos
    if (!title || !priority) {
      return NextResponse.json(
        { message: 'Título y prioridad son requeridos' },
        { status: 400 }
      );
    }

    const validPriorities = ['urgent-important', 'notUrgent-important', 'urgent-notImportant', 'notUrgent-notImportant'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { message: 'Prioridad no válida' },
        { status: 400 }
      );
    }

    // Actualizar en MariaDB 11
    const result = await query(`
      UPDATE tasks 
      SET 
        title = ?,
        description = ?,
        due_date = ?,
        priority = ?,
        completed = ?
      WHERE id = ? AND user_id = ?
    `, [
      title,
      description,
      due_date ? new Date(due_date) : null,
      priority,
      completed,
      params.id,
      user.id
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Tarea no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    // Obtener la tarea actualizada
    const [updatedTask] = await query<Task[]>(`
      SELECT * FROM tasks WHERE id = ?
    `, [params.id]);

    return NextResponse.json({
      ...updatedTask,
      due_date: updatedTask.due_date ? new Date(updatedTask.due_date).toISOString() : null,
      created_at: new Date(updatedTask.created_at).toISOString(),
      updated_at: new Date(updatedTask.updated_at).toISOString(),
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una tarea
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthCookie();
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const result = await query(`
      DELETE FROM tasks 
      WHERE id = ? AND user_id = ?
    `, [params.id, user.id]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Tarea no encontrada o no autorizada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Tarea eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}