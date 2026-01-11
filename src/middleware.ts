import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the auth cookie from PocketBase
  const authCookie = request.cookies.get('pb_auth')
  const isAuthenticated = !!authCookie?.value
  
  // 1. ROOT PATH REDIRECT
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 2. AUTH PAGE REDIRECTS
  const authPages = ['/login', '/register', '/reset-password']
  if (authPages.some(page => pathname.startsWith(page)) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 3. PROTECTED ROUTES
  // FIX: Added '/billing' and '/choose-plan' here
  const publicRoutes = [
    '/', 
    '/login', 
    '/register', 
    '/validate',
    '/verify-email', 
    '/reset-password', 
    '/privacy', 
    '/terms',
    '/billing',      // <-- ADD THIS so Stripe return url doesn't force login
    '/choose-plan'   // <-- ADD THIS so users can see plans before login if desired
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}