"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  EvaluationData,
  WIZARD_STEPS,
  WizardStep,
  scorePHQ9,
  scoreGAD7,
  scoreAUDIT,
  scoreMMSE,
  scorePANSS,
} from "@/lib/types";
import DemographicsForm from "@/components/forms/DemographicsForm";
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

export default function NewEvaluationPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("demographics");
  const [data, setData] = useState<EvaluationData>(INIT);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const stepIdx = WIZARD_STEPS.indexOf(step);
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === WIZARD_STEPS.length - 1;

  function next() {
    if (!isLast) setStep(WIZARD_STEPS[stepIdx + 1]);
  }
  function prev() {
    if (!isFirst) setStep(WIZARD_STEPS[stepIdx - 1]);
  }

  // PHQ9 helpers
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
        body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaveMsg({ type: "success", text: t("wizard.saveSuccess") });
      setTimeout(() => router.push("/dashboard"), 1500);
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

  return (
    <div className="animate-fade-in-up">
      {/* Page header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="page-title">📋 {t("wizard.steps." + step)}</h1>
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {t("wizard.progress", { current: stepIdx + 1, total: WIZARD_STEPS.length })}
        </span>
      </div>

      {/* Stepper */}
      <div className="stepper" style={{ marginBottom: "2rem" }}>
        {WIZARD_STEPS.map((s, i) => (
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
        {step === "demographics" && (
          <DemographicsForm
            data={data.demographics}
            onChange={(demographics) => setData((d) => ({ ...d, demographics }))}
          />
        )}

        {step === "chief_complaint" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {t("chiefComplaint.title")}
              </h2>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="complaint">{t("chiefComplaint.complaint")} *</label>
              <textarea
                id="complaint"
                className="form-control"
                value={data.chiefComplaint.complaint}
                onChange={(e) =>
                  setData((d) => ({ ...d, chiefComplaint: { ...d.chiefComplaint, complaint: e.target.value } }))
                }
                placeholder={t("chiefComplaint.complaintPlaceholder")}
                rows={4}
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="duration">{t("chiefComplaint.duration")}</label>
                <input
                  id="duration"
                  type="text"
                  className="form-control"
                  value={data.chiefComplaint.duration}
                  onChange={(e) =>
                    setData((d) => ({ ...d, chiefComplaint: { ...d.chiefComplaint, duration: e.target.value } }))
                  }
                  placeholder={t("chiefComplaint.durationPlaceholder")}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mainSymptoms">{t("chiefComplaint.mainSymptoms")}</label>
                <input
                  id="mainSymptoms"
                  type="text"
                  className="form-control"
                  value={data.chiefComplaint.mainSymptoms}
                  onChange={(e) =>
                    setData((d) => ({ ...d, chiefComplaint: { ...d.chiefComplaint, mainSymptoms: e.target.value } }))
                  }
                  placeholder={t("chiefComplaint.symptomsPlaceholder")}
                />
              </div>
            </div>
          </div>
        )}

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

// ─── Summary Component ────────────────────────────────────────────────────────

interface SummaryProps {
  data: EvaluationData;
  onDownload: () => void;
  onSave: () => void;
  saving: boolean;
  saveMsg: { type: "success" | "error"; text: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

function SummaryStep({ data, saveMsg, t }: SummaryProps) {
  const { demographics: d, phq9, gad7, audit, mmse, panss, mse, diagnosis, chiefComplaint } = data;

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
        <div className="grid-3">
          <SummaryField label="Paciente" value={`${d.firstName} ${d.lastName}`} />
          <SummaryField label="F. Nacimiento" value={d.birthDate} />
          <SummaryField label="Sexo" value={{ M: "Masculino", F: "Femenino", O: "Otro" }[d.sex]} />
          <SummaryField label="Estado civil" value={d.maritalStatus} />
          <SummaryField label="Ocupación" value={d.occupation || "—"} />
          <SummaryField label="F. Evaluación" value={d.evaluationDate} />
        </div>
        {chiefComplaint.complaint && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
              MOTIVO DE CONSULTA
            </div>
            <p style={{ fontSize: "0.9rem" }}>{chiefComplaint.complaint}</p>
          </div>
        )}
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
        <div style={{ height: "4px", background: "var(--color-surface)", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(total / max) * 100}%`, background: color, borderRadius: "2px" }} />
        </div>
      </div>
    </div>
  );
}
