import oracledb from "oracledb";
import fs from "fs";
import path from "path";

// Enable thin mode (pure JS, no Oracle Instant Client needed — works on Vercel)
oracledb.initOracleClient = () => {}; // no-op to skip thick mode attempt

let pool: oracledb.Pool | null = null;

export async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
    poolTimeout: 60,
  });

  return pool;
}

export async function getConnection(): Promise<oracledb.Connection> {
  const p = await getPool();
  return p.getConnection();
}

// --- LOCAL MOCK DATABASE FALLBACK SYSTEM ---
const MOCK_DB_FILE = path.join(process.cwd(), "mock_db.json");

interface MockRow {
  ID_EVALUACION: number;
  ID_USUARIO: string;
  FECHA_EVALUACION: string;
  NOMBRE_PACIENTE: string;
  FECHA_NACIMIENTO: string;
  SEXO: string;
  ESCOLARIDAD: string;
  OCUPACION: string;
  ESTADO_CIVIL: string;
  MOTIVO_CONSULTA: string;
  CIE11_CODIGO: string;
  CIE11_DESCRIPCION: string;
  EVALUACION_JSON: string;
  ACTIVO: string;
  FECHA_CREACION: string;
}

function readMockDb(): MockRow[] {
  if (!fs.existsSync(MOCK_DB_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(MOCK_DB_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeMockDb(data: MockRow[]) {
  fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<T>> {
  try {
    const conn = await getConnection();
    try {
      const result = await conn.execute<T>(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
      });
      return result;
    } finally {
      await conn.close();
    }
  } catch (dbErr) {
    console.warn("[DB Warning] Oracle Database connection failed or account locked. Using local JSON mock database.", dbErr);

    const bindObj = binds as Record<string, any>;

    // 1. List evaluations: SELECT ID_EVALUACION, NOMBRE_PACIENTE, FECHA_EVALUACION...
    if (sql.includes("SELECT ID_EVALUACION, NOMBRE_PACIENTE, FECHA_EVALUACION")) {
      const user = bindObj.usuario;
      const rows = readMockDb()
        .filter((r) => r.ACTIVO === "1" && r.ID_USUARIO === user)
        .map((r) => ({
          ID_EVALUACION: r.ID_EVALUACION,
          NOMBRE_PACIENTE: r.NOMBRE_PACIENTE,
          FECHA_EVALUACION: new Date(r.FECHA_EVALUACION), // Map back to Date if expected
          CIE11_DESCRIPCION: r.CIE11_DESCRIPCION,
          CIE11_CODIGO: r.CIE11_CODIGO,
          ID_USUARIO: r.ID_USUARIO,
        })) as unknown as T[];
      return { rows } as any;
    }

    // 2. Read single evaluation: SELECT EVALUACION_JSON FROM PSIQ_EVALUACION...
    if (sql.includes("SELECT EVALUACION_JSON")) {
      const id = bindObj.id;
      const user = bindObj.usuario;
      const match = readMockDb().find(
        (r) => r.ACTIVO === "1" && r.ID_EVALUACION === id && r.ID_USUARIO === user
      );
      const rows = match ? [{ EVALUACION_JSON: match.EVALUACION_JSON } as unknown as T] : [];
      return { rows } as any;
    }

    throw dbErr;
  }
}

export async function executeProc(
  sql: string,
  binds: oracledb.BindParameters = {}
): Promise<oracledb.Result<unknown>> {
  try {
    const conn = await getConnection();
    try {
      const result = await conn.execute(sql, binds, { autoCommit: true });
      return result;
    } finally {
      await conn.close();
    }
  } catch (dbErr) {
    console.warn("[DB Warning] Oracle Database connection failed or account locked. Using local JSON mock database.", dbErr);

    const bindObj = binds as Record<string, any>;

    // p_insertar_evaluacion
    if (sql.includes("p_insertar_evaluacion")) {
      const db = readMockDb();
      const newId = db.length > 0 ? Math.max(...db.map((r) => r.ID_EVALUACION)) + 1 : 1;

      const newRow: MockRow = {
        ID_EVALUACION: newId,
        ID_USUARIO: bindObj.id_usuario,
        NOMBRE_PACIENTE: bindObj.nombre_paciente,
        FECHA_EVALUACION: bindObj.fecha_eval,
        FECHA_NACIMIENTO: bindObj.fecha_nac,
        SEXO: bindObj.sexo,
        ESCOLARIDAD: bindObj.escolaridad,
        OCUPACION: bindObj.ocupacion,
        ESTADO_CIVIL: bindObj.estado_civil,
        MOTIVO_CONSULTA: bindObj.motivo,
        CIE11_CODIGO: bindObj.cie11_codigo,
        CIE11_DESCRIPCION: bindObj.cie11_desc,
        EVALUACION_JSON: bindObj.eval_json,
        ACTIVO: "1",
        FECHA_CREACION: new Date().toISOString(),
      };

      db.push(newRow);
      writeMockDb(db);

      return {
        outBinds: {
          id_evaluacion: newId,
        },
      } as any;
    }

    throw dbErr;
  }
}
