import { db } from 'app/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { signIn } from 'app/lib/auth'


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 1. Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // 2. Buscar usuario en la base de datos
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 3. Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // 4. Iniciar sesión con NextAuth
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl: '/dashboard'
    })

    if (result?.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // 5. Obtener la sesión para devolver datos del usuario
  

    // 6. Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email
      },
      session
    })

  } catch (error) {
    console.error('Error en el login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}