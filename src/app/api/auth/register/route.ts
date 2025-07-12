import { hashPassword } from 'app/lib/auth';
import * as db from 'app/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  // Verificar si el usuario ya existe
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUser.length > 0) {
    return NextResponse.json(
      { message: 'El usuario ya existe' },
      { status: 400 }
    );
  }

  // Crear usuario
  const hashedPassword = await hashPassword(password);
  await db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword]
  );

  return NextResponse.json({ message: 'Usuario creado' }, { status: 201 });
}