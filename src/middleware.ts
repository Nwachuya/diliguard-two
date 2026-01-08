import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, allow all requests
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/search/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/feedback/:path*',
    '/admin/:path*',
  ],
}