import {createServerClient} from '@supabase/ssr'
import {NextResponse, type NextRequest} from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({request})

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                // Dòng mới - có type
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    cookiesToSet.forEach(({name, value}) =>
                        request.cookies.set(name, value),
                    )
                    supabaseResponse = NextResponse.next({request})
                    cookiesToSet.forEach(({name, value, options}) =>
                        supabaseResponse.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    const {
        data: {user},
    } = await supabase.auth.getUser()

    const {pathname} = request.nextUrl

    // Protect /admin/dashboard and sub-routes
    if (pathname.startsWith('/admin/dashboard')) {
        if (!user) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/admin/login'
            return NextResponse.redirect(redirectUrl)
        }
    }

    // If already logged in, redirect away from login page
    if (pathname === '/admin/login' && user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/admin/dashboard'
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/admin/:path*'],
}
