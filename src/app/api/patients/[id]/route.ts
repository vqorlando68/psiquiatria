import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const result = await executeQuery<any>(
      `SELECT id, nombres, apellidos, nombres || ' ' || apellidos AS nombre_completo, correo_electronico, telefono
       FROM tkr_usuarios
       WHERE id = :id AND activo = '1'`,
      { id: Number(id) }
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ patient: result.rows[0] });
  } catch (err) {
    console.error(`GET /api/patients/${id} error:`, err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
