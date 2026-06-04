import oracledb from "oracledb";
import fs from "fs";
import path from "path";

// Enable thin mode (pure JS, no Oracle Instant Client needed — works on Vercel)
oracledb.initOracleClient = () => {}; // no-op to skip thick mode attempt

let pool: oracledb.Pool | null = null;
let dbOffline = false;
let lastOfflineCheck = 0;
const RETRY_COOLDOWN = 30000; // 30 seconds cooldown before trying to reconnect to Oracle

export async function getPool(): Promise<oracledb.Pool> {
  if (dbOffline && Date.now() - lastOfflineCheck < RETRY_COOLDOWN) {
    throw new Error("Oracle Database is marked offline (cooldown active).");
  }

  if (pool) return pool;

  try {
    pool = await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1,
      poolTimeout: 60,
    });
    dbOffline = false;
    return pool;
  } catch (err) {
    dbOffline = true;
    lastOfflineCheck = Date.now();
    throw err;
  }
}

export async function getConnection(): Promise<oracledb.Connection> {
  const p = await getPool();
  return p.getConnection();
}

// --- LOCAL MOCK DATABASE FALLBACK SYSTEM ---
const MOCK_DB_FILE = path.join(process.cwd(), "mock_db.json");

interface MockPatient {
  ID: number;
  NOMBRES: string;
  APELLIDOS: string;
  IDENTIFICACION: string;
  CORREO_ELECTRONICO: string;
  TELEFONO: string;
  ACTIVO: string;
}

interface MockEvaluation {
  ID: number;
  ID_USUARIO: string;
  ID_PACIENTE: number;
  FECHA_EVALUACION: string;
  MOTIVO_CONSULTA: string;
  CIE11_CODIGO: string;
  CIE11_DESCRIPCION: string;
  EVALUACION_JSON: string;
  ACTIVO: string;
  FECHA_CREACION: string;
}

interface MockDbStructure {
  patients: MockPatient[];
  evaluations: MockEvaluation[];
}

const DEFAULT_PATIENTS: MockPatient[] = [
  {
    ID: 1,
    NOMBRES: "Juan Carlos",
    APELLIDOS: "Pérez Gómez",
    IDENTIFICACION: "10182441",
    CORREO_ELECTRONICO: "juan.perez@example.com",
    TELEFONO: "555-0199",
    ACTIVO: "1"
  },
  {
    ID: 2,
    NOMBRES: "María Angélica",
    APELLIDOS: "Gómez Ruiz",
    IDENTIFICACION: "10245678",
    CORREO_ELECTRONICO: "maria.gomez@example.com",
    TELEFONO: "555-0244",
    ACTIVO: "1"
  },
  {
    ID: 3,
    NOMBRES: "Carlos Alberto",
    APELLIDOS: "López Marín",
    IDENTIFICACION: "79883120",
    CORREO_ELECTRONICO: "carlos.lopez@example.com",
    TELEFONO: "555-0377",
    ACTIVO: "1"
  }
];

function readMockDb(): MockDbStructure {
  if (!fs.existsSync(MOCK_DB_FILE)) {
    return { patients: DEFAULT_PATIENTS, evaluations: [] };
  }
  try {
    const raw = fs.readFileSync(MOCK_DB_FILE, "utf-8");
    const content = JSON.parse(raw);
    return {
      patients: content.patients ?? DEFAULT_PATIENTS,
      evaluations: content.evaluations ?? [],
    };
  } catch {
    return { patients: DEFAULT_PATIENTS, evaluations: [] };
  }
}

function writeMockDb(data: MockDbStructure) {
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

      // If there's an outBind cursor (ResultSet), fetch all rows and close it
      if (result.outBinds) {
        const bindKeys = Object.keys(result.outBinds);
        for (const key of bindKeys) {
          const val = (result.outBinds as any)[key];
          if (val && typeof val.getRows === "function") {
            const rows = await val.getRows(100);
            await val.close();
            return { rows } as any;
          }
        }
      }

      return result;
    } finally {
      await conn.close();
    }
  } catch (dbErr) {
    console.warn("[DB Warning] Oracle Database connection failed or account locked. Using local JSON mock database.", dbErr);

    const bindObj = binds as Record<string, any>;
    const db = readMockDb();

    // 1. Get patients from tkr_usuarios
    if (sql.includes("tkr_usuarios")) {
      let rows = db.patients.filter((p) => p.ACTIVO === "1");

      if (bindObj.id) {
        rows = rows.filter((p) => p.ID === Number(bindObj.id));
      } else if (bindObj.query) {
        const queryStr = String(bindObj.query).toLowerCase();
        rows = rows.filter(
          (p) =>
            p.NOMBRES.toLowerCase().includes(queryStr) ||
            p.APELLIDOS.toLowerCase().includes(queryStr)
        );
      }

      const formatted = rows.map((p) => ({
        ID: p.ID,
        NOMBRE_COMPLETO: `${p.NOMBRES} ${p.APELLIDOS}`,
        CORREO_ELECTRONICO: p.CORREO_ELECTRONICO,
        TELEFONO: p.TELEFONO,
        IDENTIFICACION: p.IDENTIFICACION
      })) as unknown as T[];

      return { rows: formatted } as any;
    }

    // 2. Obtain evaluations list using f_listar_evaluaciones
    if (sql.includes("f_listar_evaluaciones")) {
      const bindJson = bindObj.json ? JSON.parse(bindObj.json) : {};
      const user = bindJson.id_usuario;

      const rows = db.evaluations
        .filter((e) => e.ACTIVO === "1" && e.ID_USUARIO === user)
        .map((e) => {
          const patient = db.patients.find((p) => p.ID === e.ID_PACIENTE);
          return {
            ID: e.ID,
            NOMBRE_PACIENTE: patient ? `${patient.NOMBRES} ${patient.APELLIDOS}` : "Paciente Desconocido",
            FECHA_EVALUACION: new Date(e.FECHA_EVALUACION),
            CIE11_DESCRIPCION: e.CIE11_DESCRIPCION,
            CIE11_CODIGO: e.CIE11_CODIGO,
            ID_USUARIO: e.ID_USUARIO,
            FECHA_CREACION: new Date(e.FECHA_CREACION)
          };
        }) as unknown as T[];
      return { rows } as any;
    }

    // 3. Obtain single evaluation using f_obtener_evaluacion
    if (sql.includes("f_obtener_evaluacion")) {
      const bindJson = bindObj.json ? JSON.parse(bindObj.json) : {};
      const id = bindJson.id;
      const user = bindJson.id_usuario;

      const match = db.evaluations.find(
        (e) => e.ACTIVO === "1" && e.ID === id && e.ID_USUARIO === user
      );
      const evalJson = match ? match.EVALUACION_JSON : null;

      return {
        outBinds: {
          result: evalJson
        }
      } as any;
    }

    // Fallback error
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
      const newId = db.evaluations.length > 0 ? Math.max(...db.evaluations.map((e) => e.ID)) + 1 : 1;

      const inputJson = bindObj.json ? JSON.parse(bindObj.json) : {};
      const idPaciente = Number(inputJson.id_paciente);
      const idUsuario = inputJson.id_usuario;
      const fechaEval = inputJson.fecha_evaluacion;
      const motivo = inputJson.motivo_consulta || "";
      const cie11Codigo = inputJson.cie11_codigo || "";
      const cie11Desc = inputJson.cie11_descripcion || "";
      
      let evalJsonVal = inputJson.evaluacion_json;
      if (typeof evalJsonVal === "object") {
        evalJsonVal = JSON.stringify(evalJsonVal);
      }

      const patient = db.patients.find((p) => p.ID === idPaciente);
      let finalEvalJson = evalJsonVal;
      if (patient) {
        try {
          const parsed = JSON.parse(evalJsonVal);
          parsed.demographics = {
            ...parsed.demographics,
            firstName: patient.NOMBRES,
            lastName: patient.APELLIDOS,
            birthDate: "",
            sex: "M",
            education: "",
            occupation: "",
            maritalStatus: "S",
            email: patient.CORREO_ELECTRONICO,
            phone: patient.TELEFONO,
          };
          finalEvalJson = JSON.stringify(parsed);
        } catch (e) {
          console.error("Error updating eval_json demographics:", e);
        }
      }

      const newRow: MockEvaluation = {
        ID: newId,
        ID_USUARIO: idUsuario,
        ID_PACIENTE: idPaciente,
        FECHA_EVALUACION: fechaEval,
        MOTIVO_CONSULTA: motivo,
        CIE11_CODIGO: cie11Codigo,
        CIE11_DESCRIPCION: cie11Desc,
        EVALUACION_JSON: finalEvalJson,
        ACTIVO: "1",
        FECHA_CREACION: new Date().toISOString(),
      };

      db.evaluations.push(newRow);
      writeMockDb(db);

      return {
        outBinds: {
          id: newId,
        },
      } as any;
    }

    throw dbErr;
  }
}
