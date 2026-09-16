"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professionals } from "@/db/schema";
import {
  PROFESSIONAL_SESSION_COOKIE,
  createProfessionalSessionToken,
  verifyPassword,
  verifyProfessionalSessionToken,
} from "./auth";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function professionalLoginAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`professional-login:${ip}`, { limit: 10, windowSeconds: 15 * 60 });
  if (!allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return { ok: false, error: "Escribe tu email y contraseña." };
  }

  const [professional] = await db.select().from(professionals).where(eq(professionals.email, email.trim().toLowerCase())).limit(1);
  // Mismo mensaje exista o no la cuenta: no se confirma qué emails están dados de alta.
  const genericError = "Email o contraseña incorrectos.";

  if (!professional || !professional.passwordHash) {
    return { ok: false, error: genericError };
  }
  if (!professional.isActive) {
    return { ok: false, error: "Tu cuenta todavía no está activa. Contacta con Presupuesto Claro." };
  }

  const valid = await verifyPassword(password, professional.passwordHash);
  if (!valid) {
    return { ok: false, error: genericError };
  }

  const token = await createProfessionalSessionToken(professional.id);
  const cookieStore = await cookies();
  cookieStore.set(PROFESSIONAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  await db.update(professionals).set({ lastActivityAt: new Date() }).where(eq(professionals.id, professional.id));

  redirect("/profesional");
}

export async function professionalLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PROFESSIONAL_SESSION_COOKIE);
  redirect("/profesional/login");
}

/** Identidad del profesional autenticado en el request actual, o `null`. Para usar en Server Components/Actions del portal. */
export async function getCurrentProfessionalId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PROFESSIONAL_SESSION_COOKIE)?.value;
  return verifyProfessionalSessionToken(token);
}
