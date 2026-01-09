import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the auth cookie from PocketBase
  const authCookie = request.cookies.get('pb_auth')
  const isAuthenticated = !!authCookie?.value
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/reset-password', '/privacy', '/terms']
  
  // Check if the path matches a public route exactly or starts with it (for nested paths like verify-email/token)
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  // Protected routes (all other routes)
  const isProtectedRoute = !isPublicRoute
  
  // 1. PROTECT PRIVATE ROUTES
  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 2. PROTECT AUTH ROUTES
  // If authenticated and trying to access login/register/reset, redirect to dashboard
  const authOnlyRoutes = ['','/login', '/register', '/reset-password']
  if (isAuthenticated && authOnlyRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}