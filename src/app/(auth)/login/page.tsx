// app/(auth)/login/page.tsx
import { Suspense } from 'react';
import LoginForm from 'app/components/auth/LoginForm';

function LoginPageLoading() {
  return <div className="text-center">Cargando formulario...</div>;
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Inicia sesión en tu cuenta
          </h2>
        </div>
        <Suspense fallback={<LoginPageLoading />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
