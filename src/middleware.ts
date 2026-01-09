import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the auth cookie from PocketBase
  const authCookie = request.cookies.get('pb_auth')
  const isAuthenticated = !!authCookie?.value
  
  // 1. ROOT PATH REDIRECT
  // If user is logged in and visits homepage, send to dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. AUTH PAGE REDIRECTS
  // If user is logged in and visits login/register, send to dashboard
  const authPages = ['/login', '/register', '/reset-password']
  if (authPages.some(page => pathname.startsWith(page)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 3. PROTECTED ROUTES
  // Define public routes (pages anyone can see)
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/reset-password', '/privacy', '/terms']
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  // If route is NOT public (Protected) and user is NOT authenticated -> Login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}