import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/admin/auth";
import { PROFESSIONAL_SESSION_COOKIE, verifyProfessionalSessionToken } from "@/lib/professional/auth";

/**
 * `middleware.ts` está deprecado en Next 16, renombrado a `proxy.ts` (ver
 * node_modules/next/dist/docs/.../proxy.md) — incluido aquí porque
 * AGENTS.md advierte de que esta versión rompe convenciones conocidas.
 *
 * Protege /admin/** y /profesional/**: sin cookie de sesión válida,
 * redirige al login correspondiente. Las dos páginas de login quedan
 * fuera a propósito (si no, nadie podría llegar nunca al formulario).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const valid = await isValidSessionToken(token);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/profesional/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/profesional")) {
    const token = request.cookies.get(PROFESSIONAL_SESSION_COOKIE)?.value;
    const professionalId = await verifyProfessionalSessionToken(token);
    if (!professionalId) {
      return NextResponse.redirect(new URL("/profesional/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profesional/:path*"],
};
