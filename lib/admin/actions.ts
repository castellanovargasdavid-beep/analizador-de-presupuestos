"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, createSessionToken, isValidAdminPassword } from "./auth";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/security/rate-limit";

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginAction(_prev: LoginResult, formData: FormData): Promise<LoginResult> {
  const ip = clientIpFromHeaders(await headers());
  const { allowed } = await checkRateLimit(`admin-login:${ip}`, { limit: 10, windowSeconds: 15 * 60 });
  if (!allowed) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Escribe la contraseña." };
  }

  let valid: boolean;
  try {
    valid = await isValidAdminPassword(password);
  } catch {
    return { ok: false, error: "El panel no está configurado todavía (falta ADMIN_PASSWORD/ADMIN_SESSION_SECRET)." };
  }

  if (!valid) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
