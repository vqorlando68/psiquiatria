import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { executeQuery, executeProc } from "@/lib/db";
import type { EvaluationData } from "@/lib/types";
import oracledb from "oracledb";

// GET /api/evaluations — list evaluations for the logged-in user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await executeQuery<{
      ID_EVALUACION: number;
      NOMBRE_PACIENTE: string;
      FECHA_EVALUACION: string;
      CIE11_DESCRIPCION: string;
      ID_USUARIO: string;
    }>(
      `SELECT ID_EVALUACION, NOMBRE_PACIENTE, FECHA_EVALUACION, CIE11_DESCRIPCION, ID_USUARIO
       FROM PSIQ_EVALUACION
       WHERE ACTIVO = '1'
       AND ID_USUARIO = :usuario
       ORDER BY FECHA_EVALUACION DESC`,
      { usuario: session.username }
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
    const data: EvaluationData = await request.json();
    const evaluationJson = JSON.stringify(data);
    const nombrePaciente = `${data.demographics.firstName} ${data.demographics.lastName}`;

    const result = await executeProc(
      `BEGIN
         pkgln_evaluacion_psiquiatria.p_insertar_evaluacion(
           p_id_usuario        => :id_usuario,
           p_nombre_paciente   => :nombre_paciente,
           p_fecha_evaluacion  => TO_DATE(:fecha_eval, 'YYYY-MM-DD'),
           p_fecha_nacimiento  => TO_DATE(:fecha_nac, 'YYYY-MM-DD'),
           p_sexo              => :sexo,
           p_escolaridad       => :escolaridad,
           p_ocupacion         => :ocupacion,
           p_estado_civil      => :estado_civil,
           p_motivo_consulta   => :motivo,
           p_cie11_codigo      => :cie11_codigo,
           p_cie11_descripcion => :cie11_desc,
           p_evaluacion_json   => :eval_json,
           p_id_evaluacion     => :id_evaluacion
         );
       END;`,
      {
        id_usuario: session.username,
        nombre_paciente: nombrePaciente,
        fecha_eval: data.demographics.evaluationDate,
        fecha_nac: data.demographics.birthDate,
        sexo: data.demographics.sex,
        escolaridad: data.demographics.education,
        ocupacion: data.demographics.occupation,
        estado_civil: data.demographics.maritalStatus,
        motivo: data.chiefComplaint.complaint,
        cie11_codigo: data.diagnosis.cie11Code,
        cie11_desc: data.diagnosis.cie11Description,
        eval_json: evaluationJson,
        id_evaluacion: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );

    const outBinds = result.outBinds as { id_evaluacion: number };
    return NextResponse.json({ ok: true, id: outBinds?.id_evaluacion });
  } catch (err) {
    console.error("POST /api/evaluations error:", err);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
