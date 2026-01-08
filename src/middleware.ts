import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the auth cookie from PocketBase
  const authCookie = request.cookies.get('pb_auth')
  const isAuthenticated = !!authCookie?.value
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/reset-password', '/privacy', '/terms']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin')
  
  // Protected routes (all other routes)
  const isProtectedRoute = !isPublicRoute
  
  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // For admin routes, we'll handle role checking in the page component
  // since we need to parse the auth cookie to get user role
  // The middleware just ensures authentication exists
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}