import { hashPassword } from 'app/lib/auth';
import {db} from 'app/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  // Verificar si el usuario ya existe
  const existingUser = await db.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return NextResponse.json(
      { message: 'Usuario invalido' },
      { status: 409 }
    );
  }
  // Crear usuario
  const hashedPassword = await hashPassword(password);
  if (!hashedPassword) {
    return NextResponse.json(
      { message: 'Error al hashear la contraseña' },
      { status: 500 }
    );
  }

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
  return NextResponse.json({ message: 'Usuario creado' }, { status: 201 });
}