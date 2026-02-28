import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not use getSession() here,
  // as it reads from cookies without validation. getUser() actually
  // verifies the JWT with Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all dashboard routes — redirect to login if not authenticated
  const isDashboardRoute =
    request.nextUrl.pathname.startsWith('/programs') ||
    request.nextUrl.pathname.startsWith('/lectures') ||
    request.nextUrl.pathname.startsWith('/professors') ||
    request.nextUrl.pathname.startsWith('/outreach') ||
    request.nextUrl.pathname.startsWith('/visits')

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and visits login page, redirect to dashboard
  if (user && request.nextUrl.pathname === '/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/programs'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
