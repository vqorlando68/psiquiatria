import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/evaluations/[id]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const result = await executeQuery<{ EVALUACION_JSON: string }>(
      `SELECT EVALUACION_JSON FROM PSIQ_EVALUACION
       WHERE ID_EVALUACION = :id AND ID_USUARIO = :usuario AND ACTIVO = '1'`,
      { id: Number(id), usuario: session.username }
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const jsonStr = result.rows[0].EVALUACION_JSON;
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ evaluation: data });
  } catch (err) {
    console.error(`GET /api/evaluations/${id} error:`, err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
