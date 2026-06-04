import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    let sql = `SELECT id, nombres || ' ' || apellidos AS nombre_completo, correo_electronico, telefono FROM tkr_usuarios WHERE activo = '1'`;
    const binds: Record<string, any> = {};

    if (query) {
      sql += ` AND (LOWER(nombres) LIKE :query OR LOWER(apellidos) LIKE :query)`;
      binds.query = `%${query.toLowerCase()}%`;
    }

    sql += ` ORDER BY nombres, apellidos`;

    const result = await executeQuery<any>(sql, binds);
    return NextResponse.json({ patients: result.rows ?? [] });
  } catch (err) {
    console.error("GET /api/patients error:", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
