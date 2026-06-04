import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeQuery, executeProc } from "@/lib/db";
import oracledb from "oracledb";

// GET /api/evaluations — list evaluations for the logged-in user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeQuery<{
      ID: number;
      NOMBRE_PACIENTE: string;
      FECHA_EVALUACION: string;
      CIE11_DESCRIPCION: string;
      ID_USUARIO: string;
    }>(
      `BEGIN :cursor := pkgln_evaluacion_psiquiatria.f_listar_evaluaciones(:json); END;`,
      {
        cursor: { dir: oracledb.BIND_OUT, type: (oracledb as any).CURSOR },
        json: JSON.stringify({ id_usuario: session.username })
      }
    );

    return NextResponse.json({ evaluations: result.rows ?? [] });
  } catch (err) {
    console.error("GET /api/evaluations error:", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

// POST /api/evaluations — create a new evaluation
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { patientId, ...data } = body;

    if (!patientId) {
      return NextResponse.json({ error: "missing_patient_id" }, { status: 400 });
    }

    const payload = {
      id_usuario: session.username,
      id_paciente: Number(patientId),
      fecha_evaluacion: data.demographics?.evaluationDate || new Date().toISOString().split("T")[0],
      cie11_codigo: data.diagnosis?.cie11Code || null,
      cie11_descripcion: data.diagnosis?.cie11Description || null,
      evaluacion_json: data
    };

    const result = await executeProc(
      `BEGIN
         pkgln_evaluacion_psiquiatria.p_insertar_evaluacion(
           p_json_entrada => :json,
           p_id           => :id
         );
       END;`,
      {
        json: JSON.stringify(payload),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const outBinds = result.outBinds as { id: number };
    return NextResponse.json({ ok: true, id: outBinds?.id });
  } catch (err) {
    console.error("POST /api/evaluations error:", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
