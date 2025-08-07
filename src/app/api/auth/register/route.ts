import { hashPassword } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return NextResponse.json({ message: "Usuario invalido" }, { status: 409 });
  }
  // Crear usuario
  const hashedPassword = await hashPassword(password);
  if (!hashedPassword) {
    return NextResponse.json(
      { message: "Error al hashear la contraseña" },
      { status: 500 }
    );
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
  return NextResponse.json({ message: "Usuario creado" }, { status: 201 });
}
