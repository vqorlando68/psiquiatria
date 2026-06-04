"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EvaluationData,
  WizardStep,
  scorePHQ9,
  scoreGAD7,
  scoreAUDIT,
  scoreMMSE,
  scorePANSS,
} from "@/lib/types";
import LikertScale from "@/components/scales/LikertScale";
import AUDITScale from "@/components/scales/AUDITScale";
import MMSEScale from "@/components/scales/MMSEScale";
import PANSSScale from "@/components/scales/PANSSScale";
import MSEForm from "@/components/forms/MSEForm";

const today = new Date().toISOString().split("T")[0];

const INIT: EvaluationData = {
  demographics: {
    firstName: "",
    lastName: "",
    birthDate: "",
    sex: "M",
    maritalStatus: "S",
    education: "university",
    occupation: "",
    evaluationDate: today,
  },
  chiefComplaint: { complaint: "", duration: "", mainSymptoms: "" },
  phq9: { answers: Array(9).fill(-1), total: 0, interpretation: "minimal" },
  gad7: { answers: Array(7).fill(-1), total: 0, interpretation: "minimal" },
  audit: { answers: Array(10).fill(0), total: 0, interpretation: "low" },
  mmse: { scores: Array(19).fill(0), total: 0, interpretation: "normal" },
  panss: {
    positive: Array(7).fill(1),
    negative: Array(7).fill(1),
    general: Array(16).fill(1),
    positiveTotal: 7,
    negativeTotal: 7,
    generalTotal: 16,
    compositeIndex: 0,
    total: 30,
  },
  mse: {
    appearance: "", attitude: "", psychomotor: "", speech: "",
    affect: "", mood: "", thoughtProcess: "", thoughtContent: "",
    perceptions: "", cognition: "", insight: "", judgment: "",
  },
  diagnosis: { cie11Code: "", cie11Description: "", additionalNotes: "" },
};

// Wizard steps starting directly at PHQ-9 and omitting chief complaint
const RUN_STEPS: WizardStep[] = [
  "phq9",
  "gad7",
  "audit",
  "mmse",
  "panss",
  "mse",
  "diagnosis",
  "summary",
];

function RunEvaluationContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [step, setStep] = useState<WizardStep>("phq9");
  const [data, setData] = useState<EvaluationData>(INIT);
  const [patient, setPatient] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!patientId) return;

    async function loadPatient() {
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (!res.ok) throw new Error("patient_not_found");
        const json = await res.json();
        const p = json.patient;
        setPatient(p);

        // Prepopulate demographics in EvaluationData with real patient properties
        setData((d) => ({
          ...d,
          demographics: {
            firstName: p.NOMBRES,
            lastName: p.APELLIDOS,
            birthDate: "",
            sex: "M",
            maritalStatus: "S",
            education: "university",
            occupation: "",
            email: p.CORREO_ELECTRONICO,
            phone: p.TELEFONO,
            evaluationDate: today,
          },
        }));
      } catch (err) {
        console.error("Error loading patient:", err);
        setSaveMsg({ type: "error", text: "No se pudieron cargar los datos del paciente." });
      } finally {
        setLoadingPatient(false);
      }
    }

    loadPatient();
  }, [patientId]);

  const stepIdx = RUN_STEPS.indexOf(step);
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === RUN_STEPS.length - 1;

  function next() {
    if (!isLast) setStep(RUN_STEPS[stepIdx + 1]);
  }
  function prev() {
    if (!isFirst) setStep(RUN_STEPS[stepIdx - 1]);
  }

  function updatePHQ9(answers: number[]) {
    const { total, interpretation } = scorePHQ9(answers.map((a) => Math.max(0, a)));
    setData((d) => ({ ...d, phq9: { answers, total, interpretation } }));
  }

  // GAD7 helpers
  function updateGAD7(answers: number[]) {
    const { total, interpretation } = scoreGAD7(answers.map((a) => Math.max(0, a)));
    setData((d) => ({ ...d, gad7: { answers, total, interpretation } }));
  }

  // AUDIT helpers
  function updateAUDIT(answers: number[]) {
    const { total, interpretation } = scoreAUDIT(answers);
    setData((d) => ({ ...d, audit: { answers, total, interpretation } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          ...data,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaveMsg({ type: "success", text: t("wizard.saveSuccess") });
      setSaveSuccess(true);
    } catch {
      setSaveMsg({ type: "error", text: t("wizard.saveError") });
    } finally {
      setSaving(false);
    }
  }

  function downloadJson() {
    const blob = new Blob(
      [JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `psiq_${data.demographics.lastName || "evaluacion"}_${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!patientId) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <h2>⚠️ Parámetro Incompleto</h2>
        <p>No se especificó un ID de paciente para realizar la prueba.</p>
        <button className="btn btn-primary" onClick={() => router.push("/evaluation/new")}>
          Volver a Selección
        </button>
      </div>
    );
  }

  if (loadingPatient) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h3>Cargando información del paciente...</h3>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="card animate-fade-in" style={{ textAlign: "center", padding: "4rem 2rem", maxWidth: "600px", margin: "2rem auto" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
        <h2>¡Evaluación Guardada Exitosamente!</h2>
        <p style={{ color: "var(--color-text-muted)", margin: "1rem 0 2rem 0" }}>
          La evaluación clínica para <strong>{patient.NOMBRES} {patient.APELLIDOS}</strong> ha sido registrada en el sistema.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button className="btn btn-secondary" onClick={() => window.close()}>
            Cerrar esta pestaña
          </button>
          <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Sticky patient banner */}
      <div
        style={{
          background: "var(--color-surface-3)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          padding: "0.875rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
            Paciente en Evaluación
          </span>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            👤 {patient.NOMBRES} {patient.APELLIDOS}
          </span>
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", textAlign: "right" }}>
          <span>✉️ {patient.CORREO_ELECTRONICO || "—"}</span>
          <span style={{ margin: "0 0.75rem" }}>•</span>
          <span>📞 {patient.TELEFONO || "—"}</span>
        </div>
      </div>

      {/* Page header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="page-title">📋 {t("wizard.steps." + step)}</h1>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Progreso: {stepIdx + 1} de {RUN_STEPS.length}
        </span>
      </div>

      {/* Stepper */}
      <div className="stepper" style={{ marginBottom: "2rem" }}>
        {RUN_STEPS.map((s, i) => (
          <button
            key={s}
            className={`step-item ${i < stepIdx ? "completed" : ""} ${s === step ? "active" : ""}`}
            onClick={() => setStep(s)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0.25rem" }}
            title={t(`wizard.steps.${s}`)}
          >
            <div className="step-circle">
              {i < stepIdx ? "✓" : i + 1}
            </div>
            <span className="step-label">{t(`wizard.steps.${s}`)}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ marginBottom: "1.5rem", minHeight: "400px" }}>
        {step === "phq9" && (
          <LikertScale
            namespace="phq9"
            answers={data.phq9.answers}
            onChange={updatePHQ9}
            total={data.phq9.total}
            interpretation={data.phq9.interpretation}
          />
        )}

        {step === "gad7" && (
          <LikertScale
            namespace="gad7"
            answers={data.gad7.answers}
            onChange={updateGAD7}
            total={data.gad7.total}
            interpretation={data.gad7.interpretation}
          />
        )}

        {step === "audit" && (
          <AUDITScale
            answers={data.audit.answers}
            onChange={updateAUDIT}
            total={data.audit.total}
            interpretation={data.audit.interpretation}
          />
        )}

        {step === "mmse" && (
          <MMSEScale
            data={data.mmse}
            onChange={(mmse) => setData((d) => ({ ...d, mmse }))}
          />
        )}

        {step === "panss" && (
          <PANSSScale
            data={data.panss}
            onChange={(panss) => setData((d) => ({ ...d, panss }))}
          />
        )}

        {step === "mse" && (
          <MSEForm
            data={data.mse}
            onChange={(mse) => setData((d) => ({ ...d, mse }))}
          />
        )}

        {step === "diagnosis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {t("diagnosis.title")}
              </h2>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="cie11Code">{t("diagnosis.cie11Code")}</label>
                <input
                  id="cie11Code"
                  type="text"
                  className="form-control"
                  value={data.diagnosis.cie11Code}
                  onChange={(e) =>
                    setData((d) => ({ ...d, diagnosis: { ...d.diagnosis, cie11Code: e.target.value } }))
                  }
                  placeholder={t("diagnosis.cie11Placeholder")}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cie11Description">{t("diagnosis.cie11Description")}</label>
                <input
                  id="cie11Description"
                  type="text"
                  className="form-control"
                  value={data.diagnosis.cie11Description}
                  onChange={(e) =>
                    setData((d) => ({ ...d, diagnosis: { ...d.diagnosis, cie11Description: e.target.value } }))
                  }
                  placeholder={t("diagnosis.cie11DescPlaceholder")}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="additionalNotes">{t("diagnosis.additionalNotes")}</label>
              <textarea
                id="additionalNotes"
                className="form-control"
                value={data.diagnosis.additionalNotes}
                onChange={(e) =>
                  setData((d) => ({ ...d, diagnosis: { ...d.diagnosis, additionalNotes: e.target.value } }))
                }
                placeholder={t("diagnosis.notesPlaceholder")}
                rows={5}
              />
            </div>
          </div>
        )}

        {step === "summary" && (
          <SummaryStep data={data} onDownload={downloadJson} onSave={handleSave} saving={saving} saveMsg={saveMsg} t={t} />
        )}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          className="btn btn-secondary"
          onClick={prev}
          disabled={isFirst}
        >
          ← {t("wizard.prev")}
        </button>

        {!isLast ? (
          <button className="btn btn-primary" onClick={next}>
            {t("wizard.next")} →
          </button>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={downloadJson}>
              📥 {t("summary.exportJson")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t("wizard.saving") : `💾 ${t("wizard.save")}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RunEvaluationPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>}>
      <RunEvaluationContent />
    </Suspense>
  );
}

// ─── Summary Component ────────────────────────────────────────────────────────

interface SummaryProps {
  data: EvaluationData;
  onDownload: () => void;
  onSave: () => void;
  saving: boolean;
  saveMsg: { type: "success" | "error"; text: string } | null;
  t: any;
}

function SummaryStep({ data, saveMsg, t }: SummaryProps) {
  const { demographics: d, phq9, gad7, audit, mmse, panss, mse, diagnosis } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>{t("summary.title")}</h2>

      {saveMsg && (
        <div className={`alert alert-${saveMsg.type}`}>
          <span>{saveMsg.type === "success" ? "✅" : "⚠️"}</span>
          {saveMsg.text}
        </div>
      )}

      {/* Patient */}
      <div className="card" style={{ background: "var(--color-surface-2)" }}>
        <div className="section-header">
          <div className="section-icon">👤</div>
          <h3 style={{ fontSize: "0.95rem" }}>{t("summary.patient")}</h3>
        </div>
        <div className="grid-2">
          <SummaryField label="Nombres y Apellidos" value={`${d.firstName} ${d.lastName}`} />
          <SummaryField label="Correo Electrónico" value={d.email || "—"} />
          <SummaryField label="Teléfono" value={d.phone || "—"} />
          <SummaryField label="F. Evaluación" value={d.evaluationDate} />
        </div>
      </div>

      {/* Scales */}
      <div className="card" style={{ background: "var(--color-surface-2)" }}>
        <div className="section-header">
          <div className="section-icon">📊</div>
          <h3 style={{ fontSize: "0.95rem" }}>{t("summary.scales")}</h3>
        </div>
        <div className="grid-2" style={{ gap: "0.75rem" }}>
          <ScaleSummaryCard name="PHQ-9" total={phq9.total} max={27} interp={phq9.interpretation} label={t(`phq9.interpretation.${phq9.interpretation}`)} />
          <ScaleSummaryCard name="GAD-7" total={gad7.total} max={21} interp={gad7.interpretation} label={t(`gad7.interpretation.${gad7.interpretation}`)} />
          <ScaleSummaryCard name="AUDIT" total={audit.total} max={40} interp={audit.interpretation === "low" ? "minimal" : audit.interpretation === "hazardous" ? "mild" : audit.interpretation === "harmful" ? "moderate" : "severe"} label={t(`audit.interpretation.${audit.interpretation}`)} />
          <ScaleSummaryCard name="MMSE" total={mmse.total} max={30} interp={mmse.interpretation} label={t(`mmse.interpretation.${mmse.interpretation}`)} />
          <ScaleSummaryCard name="PANSS +" total={panss.positiveTotal} max={49} interp="moderate" label={`Positiva: ${panss.positiveTotal}`} />
          <ScaleSummaryCard name="PANSS −" total={panss.negativeTotal} max={49} interp="moderate" label={`Negativa: ${panss.negativeTotal}`} />
        </div>
      </div>

      {/* MSE quick view */}
      <div className="card" style={{ background: "var(--color-surface-2)" }}>
        <div className="section-header">
          <div className="section-icon">🧠</div>
          <h3 style={{ fontSize: "0.95rem" }}>{t("summary.mse")}</h3>
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

      {/* Diagnosis */}
      {(diagnosis.cie11Code || diagnosis.cie11Description) && (
        <div className="card" style={{ background: "var(--color-surface-2)" }}>
          <div className="section-header">
            <div className="section-icon">📄</div>
            <h3 style={{ fontSize: "0.95rem" }}>{t("summary.diagnosis")}</h3>
          </div>
          <div className="grid-2">
            {diagnosis.cie11Code && <SummaryField label="Código CIE-11" value={diagnosis.cie11Code} />}
            {diagnosis.cie11Description && <SummaryField label="Diagnóstico" value={diagnosis.cie11Description} />}
          </div>
          {diagnosis.additionalNotes && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>NOTAS</div>
              <p style={{ fontSize: "0.9rem" }}>{diagnosis.additionalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: 500, marginTop: "0.15rem" }}>{value || "—"}</div>
    </div>
  );
}

function ScaleSummaryCard({
  name,
  total,
  max,
  interp,
  label,
}: {
  name: string;
  total: number;
  max: number;
  interp: string;
  label: string;
}) {
  const color = `var(--color-severity-${interp})`;
  return (
    <div
      style={{
        background: "var(--color-surface-3)",
        borderRadius: "10px",
        padding: "0.875rem",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ textAlign: "center", minWidth: "48px" }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>/{max}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: "0.75rem", color }}>
          {label}
        </div>
      </div>
    </div>
  );
}
