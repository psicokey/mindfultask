// src/app/page.tsx
import Link from 'next/link';
import { FaCheckCircle, FaBrain, FaClock, FaChartLine, FaGithub } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">MindfulTask</span> - Productividad con Propósito
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            El gestor de tareas que combina técnicas psicológicas con herramientas de productividad 
            para ayudarte a lograr más sin quemarte.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              Comenzar Gratis
            </Link>
            <Link 
              href="#features" 
              className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 px-8 rounded-lg text-lg transition-colors border border-gray-300 shadow-sm"
            >
              Conocer Más
            </Link>
          </div>
        </div>
      </header>

      {/* Logo Cloud */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-500 mb-8">Tecnologías utilizadas:</p>
          <div className="flex flex-wrap justify-center gap-12 items-center">
            <img src="/nextjs-logo.svg" alt="Next.js" className="h-12" />
            <img src="/tailwindcss-logo.svg" alt="Tailwind CSS" className="h-8" />
            <img src="/react-logo.svg" alt="React" className="h-12" />
            <img src="/typescript-logo.svg" alt="TypeScript" className="h-10" />
            <img src="/mariadb-logo.svg" alt="MariaDB" className="h-10" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            Características diseñadas para tu <span className="text-blue-600">bienestar mental</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <FaBrain className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Técnicas Psicológicas</h3>
              <p className="text-gray-600">
                Incorpora principios de psicología cognitiva para mejorar tu enfoque y reducir la fatiga mental.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <FaClock className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Pomodoro Inteligente</h3>
              <p className="text-gray-600">
                Temporizador que ajusta los intervalos según tu nivel de fatiga y tipo de tarea.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <FaChartLine className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Estadísticas de Productividad</h3>
              <p className="text-gray-600">
                Visualiza tus patrones de trabajo y recibe recomendaciones personalizadas.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <FaCheckCircle className="text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Matriz de Eisenhower</h3>
              <p className="text-gray-600">
                Clasifica tus tareas por importancia y urgencia para una mejor priorización.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Recordatorios Mindful</h3>
              <p className="text-gray-600">
                Alertas que te invitan a pausas conscientes y respiraciones profundas.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Seguridad y Privacidad</h3>
              <p className="text-gray-600">
                Tus datos están protegidos con encriptación y autenticación segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Lo que dicen nuestros <span className="text-blue-600">usuarios</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="font-bold">AM</span>
                </div>
                <div>
                  <h4 className="font-bold">Ana Martínez</h4>
                  <p className="text-gray-500">Psicóloga</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "MindfulTask ha transformado cómo organizo mi día. Las pausas conscientes integradas 
                han reducido mi estrés significativamente mientras mantengo mi productividad."
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="font-bold">CR</span>
                </div>
                <div>
                  <h4 className="font-bold">Carlos Rodríguez</h4>
                  <p className="text-gray-500">Desarrollador</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Como desarrollador, paso horas frente a la computadora. MindfulTask me ayuda a 
                mantener el enfoque sin descuidar mi bienestar mental. ¡La matriz de Eisenhower es un game-changer!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para transformar tu productividad?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Únete a miles de usuarios que ya están logrando más sin sacrificar su bienestar mental.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/register" 
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              Comenzar Gratis
            </Link>
            <Link 
              href="#features" 
              className="bg-transparent hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors border border-white shadow-sm"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MindfulTask</h3>
              <p className="text-gray-400">
                La herramienta de productividad que cuida de tu bienestar mental.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Características</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentación</Link></li>
                <li><Link href="/support" className="text-gray-400 hover:text-white transition-colors">Soporte</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-white transition-colors">Comunidad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Conectar</h4>
              <div className="flex space-x-4">
                <Link href="https://github.com/tu-usuario/mindfultask" className="text-gray-400 hover:text-white transition-colors">
                  <FaGithub className="text-2xl" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiExternalLink className="text-2xl" />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} MindfulTask. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}