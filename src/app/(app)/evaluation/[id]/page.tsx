import { getSession } from "@/lib/auth";
import { executeQuery } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EvaluationPage(props: PageProps<"/evaluation/[id]">) {
  const t = await getTranslations();
  const session = await getSession();
  const { id } = await props.params;

  let evaluation = null;
  try {
    const result = await executeQuery<{ EVALUACION_JSON: string }>(
      `SELECT evaluacion_json FROM tkr_evaluacion
       WHERE id = :id AND id_usuario = :usuario AND activo = '1'`,
      { id: Number(id), usuario: session!.username }
    );
    if (!result.rows || result.rows.length === 0) notFound();
    evaluation = JSON.parse(result.rows[0].EVALUACION_JSON);
  } catch {
    notFound();
  }

  const { demographics: d, phq9, gad7, audit, mmse, panss, mse, diagnosis } = evaluation;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">← Volver</Link>
        <h1 className="page-title">
          {d.firstName} {d.lastName}
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Patient info */}
        <div className="card">
          <div className="section-header">
            <div className="section-icon">👤</div>
            <h2 style={{ fontSize: "1rem" }}>{t("viewer.sections.demographics")}</h2>
          </div>
          <div className="grid-3">
            {[
              ["Nombres y Apellidos", `${d.firstName} ${d.lastName}`],
              ["Correo Electrónico", d.email || "—"],
              ["Teléfono", d.phone || "—"],
              ["Fecha de Evaluación", d.evaluationDate || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scales summary */}
        <div className="card">
          <div className="section-header">
            <div className="section-icon">📊</div>
            <h2 style={{ fontSize: "1rem" }}>{t("viewer.sections.scales")}</h2>
          </div>
          <div className="grid-2">
            {[
              { name: "PHQ-9", total: phq9.total, max: 27, interp: phq9.interpretation, label: t(`phq9.interpretation.${phq9.interpretation}`) },
              { name: "GAD-7", total: gad7.total, max: 21, interp: gad7.interpretation, label: t(`gad7.interpretation.${gad7.interpretation}`) },
              { name: "AUDIT", total: audit.total, max: 40, interp: audit.interpretation, label: t(`audit.interpretation.${audit.interpretation}`) },
              { name: "MMSE", total: mmse.total, max: 30, interp: mmse.interpretation, label: t(`mmse.interpretation.${mmse.interpretation}`) },
              { name: "PANSS Total", total: panss.total, max: 210, interp: "moderate", label: `P:${panss.positiveTotal} N:${panss.negativeTotal} G:${panss.generalTotal}` },
            ].map((s) => (
              <div
                key={s.name}
                style={{
                  background: "var(--color-surface-2)",
                  borderRadius: "10px",
                  padding: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.875rem",
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: `var(--color-severity-${s.interp})`, minWidth: "48px", textAlign: "center" }}>
                  {s.total}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</div>
                  <div style={{ fontSize: "0.8rem", color: `var(--color-severity-${s.interp})` }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MSE */}
        {mse && (
          <div className="card">
            <div className="section-header">
              <div className="section-icon">🧠</div>
              <h2 style={{ fontSize: "1rem" }}>{t("viewer.sections.mse")}</h2>
            </div>
            <div className="mse-grid">
              {(Object.entries(mse) as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="mse-item">
                  <div className="mse-item-label">{t(`mse.sections.${k}`)}</div>
                  <div className="mse-item-value">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (diagnosis.cie11Code || diagnosis.cie11Description) && (
          <div className="card">
            <div className="section-header">
              <div className="section-icon">📋</div>
              <h2 style={{ fontSize: "1rem" }}>{t("viewer.sections.diagnosis")}</h2>
            </div>
            {diagnosis.cie11Code && (
              <div style={{ marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 600, color: "var(--color-primary-light)", fontSize: "1.1rem", marginRight: "0.75rem" }}>
                  {diagnosis.cie11Code}
                </span>
                {diagnosis.cie11Description}
              </div>
            )}
            {diagnosis.additionalNotes && <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>{diagnosis.additionalNotes}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
