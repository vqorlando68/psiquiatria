import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const valid = await validateCredentials(username, password);
    if (!valid) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }

    await createSession(username);
    return NextResponse.json({ ok: true, username });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
