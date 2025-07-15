import { Metadata } from 'next'
import LoginForm from 'app/components/auth/LoginForm'
import {auth} from 'app/lib/auth'
import { redirect } from 'next/navigation'



export const metadata: Metadata = {
  title: 'Iniciar sesión | MindfulTask',
  description: 'Inicia sesión en tu cuenta de MindfulTask',
}

export default async function LoginPage() {
  const session = await auth()

  // Redirigir si ya está autenticado
  if (session?.user) {
    redirect('/dashboard')
    
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          MindfulTask
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Organiza tu trabajo, mejora tu productividad
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}