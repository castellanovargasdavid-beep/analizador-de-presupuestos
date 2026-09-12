import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin/auth";

/**
 * `middleware.ts` está deprecado en Next 16, renombrado a `proxy.ts` (ver
 * node_modules/next/dist/docs/.../proxy.md) — incluido aquí porque
 * AGENTS.md advierte de que esta versión rompe convenciones conocidas.
 *
 * Protege /admin/**: sin cookie de sesión válida, redirige a
 * /admin/login. /admin/login queda fuera a propósito (si no, nadie podría
 * llegar nunca al formulario de login).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await isValidSessionToken(token);

  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
