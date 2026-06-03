"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { EvaluationData } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SEVERITY_COLOR: Record<string, string> = {
  minimal: "#10b981",
  mild: "#f59e0b",
  moderate: "#f97316",
  moderatelySevere: "#f97316",
  severe: "#ef4444",
  normal: "#10b981",
  low: "#10b981",
  hazardous: "#f59e0b",
  harmful: "#f97316",
  dependent: "#ef4444",
};

export default function ViewerPage() {
  const t = useTranslations("viewer");
  const fileRef = useRef<HTMLInputElement>(null);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setEvaluation(parsed);
      } catch {
        setError("Archivo JSON inválido. Verifique el formato.");
      }
    };
    reader.readAsText(file);
  }

  const scalesData = evaluation
    ? [
        { name: "PHQ-9", score: evaluation.phq9.total, max: 27, interp: evaluation.phq9.interpretation },
        { name: "GAD-7", score: evaluation.gad7.total, max: 21, interp: evaluation.gad7.interpretation },
        { name: "AUDIT", score: evaluation.audit.total, max: 40, interp: evaluation.audit.interpretation },
        { name: "MMSE", score: evaluation.mmse.total, max: 30, interp: evaluation.mmse.interpretation },
        { name: "PANSS+", score: evaluation.panss.positiveTotal, max: 49, interp: "moderate" },
        { name: "PANSS−", score: evaluation.panss.negativeTotal, max: 49, interp: "moderate" },
        { name: "PANSS G", score: evaluation.panss.generalTotal, max: 112, interp: "moderate" },
      ]
    : [];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title">📂 {t("title")}</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          {t("subtitle")}
        </p>
      </div>

      {/* File loader */}
      <div
        className="card"
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1,
            minHeight: "80px",
            border: "2px dashed var(--color-border)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: "1rem",
          }}
          onMouseEnter={(e) => ((e.currentTarget.style.borderColor = "var(--color-primary)"))}
          onMouseLeave={(e) => ((e.currentTarget.style.borderColor = "var(--color-border)"))}
        >
          <span style={{ fontSize: "1.5rem" }}>📁</span>
          <div>
            <div style={{ fontWeight: 500 }}>{t("loadFile")}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {evaluation ? `✅ ${(evaluation.demographics.firstName || "")} ${(evaluation.demographics.lastName || "")}` : t("noFile")}
            </div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileLoad}
        />
        {evaluation && (
          <button
            className="btn btn-secondary"
            onClick={() => { setEvaluation(null); if (fileRef.current) fileRef.current.value = ""; }}
          >
            🗑 Limpiar
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {evaluation && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Patient header */}
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))",
              borderColor: "rgba(99,102,241,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  {evaluation.demographics.firstName} {evaluation.demographics.lastName}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  {evaluation.demographics.sex === "M" ? "Masculino" : evaluation.demographics.sex === "F" ? "Femenino" : "Otro"} ·{" "}
                  {evaluation.demographics.birthDate} · {evaluation.demographics.occupation}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Fecha de Evaluación</div>
                <div style={{ fontWeight: 600 }}>{evaluation.demographics.evaluationDate}</div>
                {evaluation.evaluator && (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    Evaluador: {evaluation.evaluator}
                  </div>
                )}
              </div>
            </div>
            {evaluation.chiefComplaint?.complaint && (
              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(99,102,241,0.2)",
                  fontSize: "0.9rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <strong style={{ color: "var(--color-text)" }}>Motivo de consulta: </strong>
                {evaluation.chiefComplaint.complaint}
              </div>
            )}
          </div>

          {/* Scales chart */}
          <div className="card">
            <div className="section-header">
              <div className="section-icon">📊</div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("sections.scales")}</h2>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a27", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", color: "#e2e8f0" }}
                  formatter={(val: any, _name: any, entry: any) => [`${val} / ${entry.payload?.max ?? ""}`, entry.payload?.name ?? ""]}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {scalesData.map((entry, idx) => (
                    <Cell key={idx} fill={SEVERITY_COLOR[entry.interp] ?? "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Score cards below chart */}
            <div className="grid-3" style={{ marginTop: "1rem", gap: "0.625rem" }}>
              {scalesData.map((s) => (
                <div
                  key={s.name}
                  style={{
                    background: "var(--color-surface-2)",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    border: `1px solid ${SEVERITY_COLOR[s.interp] ?? "#6366f1"}30`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: SEVERITY_COLOR[s.interp] ?? "#6366f1",
                      minWidth: "42px",
                      textAlign: "center",
                    }}
                  >
                    {s.score}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>/ {s.max}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MSE */}
          {evaluation.mse && Object.values(evaluation.mse).some(Boolean) && (
            <div className="card">
              <div className="section-header">
                <div className="section-icon">🧠</div>
                <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("sections.mse")}</h2>
              </div>
              <div className="mse-grid">
                {(Object.entries(evaluation.mse) as [string, string][])
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="mse-item">
                      <div className="mse-item-label">{k.replace(/([A-Z])/g, " $1").toUpperCase()}</div>
                      <div className="mse-item-value">{v}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {(evaluation.diagnosis?.cie11Code || evaluation.diagnosis?.cie11Description) && (
            <div className="card">
              <div className="section-header">
                <div className="section-icon">📋</div>
                <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("sections.diagnosis")}</h2>
              </div>
              <div className="grid-2">
                {evaluation.diagnosis.cie11Code && (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      CÓDIGO CIE-11
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--color-primary-light)", fontSize: "1.1rem" }}>
                      {evaluation.diagnosis.cie11Code}
                    </div>
                  </div>
                )}
                {evaluation.diagnosis.cie11Description && (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      DIAGNÓSTICO
                    </div>
                    <div style={{ fontWeight: 500 }}>{evaluation.diagnosis.cie11Description}</div>
                  </div>
                )}
              </div>
              {evaluation.diagnosis.additionalNotes && (
                <div
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
                    NOTAS / PLAN TERAPÉUTICO
                  </div>
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{evaluation.diagnosis.additionalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Print button */}
          <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨 Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
