import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicRoutes = [  
  '/',
  '/auth/login',
  '/auth/register',
]

const authRoutes = [
  '/auth/login',
  '/auth/register',
]

const secret = process.env.NEXTAUTH_SECRET

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret })
  const { nextUrl } = req
  const isLoggedIn = !!token
  const { pathname } = nextUrl

  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)

  // Si un usuario logueado intenta acceder a las rutas de autenticación,
  // lo redirigimos al dashboard.
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl))
  }

  return NextResponse.next()
}

export const config = {  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
