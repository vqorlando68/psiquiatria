import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { locale } = await request.json();
  const validLocales = ["es", "en"];
  const safeLocale = validLocales.includes(locale) ? locale : "es";

  const cookieStore = await cookies();
  cookieStore.set("locale", safeLocale, {
    httpOnly: false, // accessible to client for UI update
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true, locale: safeLocale });
}
