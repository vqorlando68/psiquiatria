import { getSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface EvalRow {
  ID_EVALUACION: number;
  NOMBRE_PACIENTE: string;
  FECHA_EVALUACION: Date;
  CIE11_DESCRIPCION: string;
  ID_USUARIO: string;
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const session = await getSession();

  let evaluations: EvalRow[] = [];
  let dbError = false;

  try {
    const result = await executeQuery<EvalRow>(
      `SELECT ID_EVALUACION, NOMBRE_PACIENTE, FECHA_EVALUACION, CIE11_DESCRIPCION, ID_USUARIO
       FROM PSIQ_EVALUACION
       WHERE ACTIVO = '1' AND ID_USUARIO = :usuario
       ORDER BY FECHA_EVALUACION DESC
       FETCH FIRST 50 ROWS ONLY`,
      { usuario: session!.username }
    );
    evaluations = (result.rows ?? []) as EvalRow[];
  } catch {
    dbError = true;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">{t("title")}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            👤 {session!.username}
          </p>
        </div>
        <Link href="/evaluation/new" className="btn btn-primary">
          ➕ {t("newEval")}
        </Link>
      </div>

      {dbError && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <span>⚠️</span>
          <span>No se pudo conectar a la base de datos. Verifique la configuración de Oracle.</span>
        </div>
      )}

      {!dbError && evaluations.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "3rem" }}>📋</div>
          <h2 style={{ fontSize: "1.2rem", color: "var(--color-text-muted)" }}>{t("empty")}</h2>
          <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem" }}>{t("emptyDesc")}</p>
          <Link href="/evaluation/new" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
            ➕ {t("newEval")}
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t("columns.patient")}</th>
                <th>{t("columns.date")}</th>
                <th>{t("columns.diagnosis")}</th>
                <th>{t("columns.evaluator")}</th>
                <th>{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev.ID_EVALUACION}>
                  <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                    {ev.ID_EVALUACION}
                  </td>
                  <td style={{ fontWeight: 500 }}>{ev.NOMBRE_PACIENTE}</td>
                  <td style={{ color: "var(--color-text-muted)" }}>
                    {ev.FECHA_EVALUACION
                      ? new Date(ev.FECHA_EVALUACION).toLocaleDateString("es", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                  <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ev.CIE11_DESCRIPCION || "—"}
                  </td>
                  <td style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    {ev.ID_USUARIO}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link
                        href={`/evaluation/${ev.ID_EVALUACION}`}
                        className="btn btn-secondary btn-sm"
                      >
                        👁 {t("view")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats cards */}
      {!dbError && evaluations.length > 0 && (
        <div className="grid-3" style={{ marginTop: "2rem" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary-light)" }}>
              {evaluations.length}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Evaluaciones totales</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-accent)" }}>
              {evaluations.filter(e => {
                const d = new Date(e.FECHA_EVALUACION);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Este mes</div>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-success)" }}>
              {new Set(evaluations.map(e => e.NOMBRE_PACIENTE)).size}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Pacientes únicos</div>
          </div>
        </div>
      )}
    </div>
  );
}
