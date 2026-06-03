import { cookies } from "next/headers";
import { executeQuery } from "./db";

export interface SessionUser {
  username: string;
}

const SESSION_COOKIE = "psiq_session";

/**
 * Validates credentials via pkgln_seguridad.f_validar_clave
 * Returns 1 if valid, other values mean invalid
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  // Temporary bypass for testing/development when we don't have real credentials
  if (username === "doctor_test" && password === "password123") {
    return true;
  }

  try {
    const result = await executeQuery<{ RESULT: number }>(
      `BEGIN :result := pkgln_seguridad.f_validar_clave(:usuario, :clave, 4); END;`,
      {
        result: { dir: 3003, type: 2010 }, // BIND_OUT, NUMBER
        usuario: username,
        clave: password,
      }
    );
    const outBinds = result.outBinds as { result: number };
    return outBinds?.result === 1;
  } catch (err) {
    console.error("Auth error:", err);
    throw err;
  }
}

/**
 * Creates a simple session by storing the username in an HTTP-only cookie.
 * In production, sign this with a secret (e.g. using jose or iron-session).
 */
export async function createSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({ username, ts: Date.now() })).toString("base64");
  cookieStore.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const data = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return { username: data.username };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
