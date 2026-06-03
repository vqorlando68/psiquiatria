"use client";

import { useTranslations } from "next-intl";

interface AUDITProps {
  answers: number[];
  onChange: (answers: number[]) => void;
  total: number;
  interpretation: string;
}

// AUDIT scoring: items 1-8 scored 0-4, items 9-10 scored 0,2,4
const AUDIT_SCORES = [
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4],
  [0, 2, 4],        // item 9: No, Yes-not-last-year, Yes-last-year
  [0, 2, 4],        // item 10
];

export default function AUDITScale({ answers, onChange, total, interpretation }: AUDITProps) {
  const t = useTranslations("audit");
  const questions = t.raw("questions") as Array<{ q: string; options: string[] }>;

  function setAnswer(idx: number, optIdx: number) {
    const next = [...answers];
    next[idx] = AUDIT_SCORES[idx][optIdx];
    onChange(next);
  }

  function getSelectedOptIdx(qIdx: number): number {
    const scores = AUDIT_SCORES[qIdx];
    return scores.indexOf(answers[qIdx]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("title")}</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{t("instructions")}</p>
      </div>

      {/* Score */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1rem 1.5rem",
          background: "var(--color-surface-2)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: `var(--color-severity-${interpretation === "low" ? "minimal" : interpretation === "hazardous" ? "mild" : interpretation === "harmful" ? "moderate" : "severe"})`,
              lineHeight: 1,
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>/ 40</div>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
            {t("score")}
          </div>
          <span className={`badge badge-${interpretation}`}>
            {t(`interpretation.${interpretation}`)}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: "8px", background: "var(--color-surface-3)", borderRadius: "4px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(total / 40) * 100}%`,
                background: total <= 7 ? "var(--color-success)" : total <= 15 ? "var(--color-warning)" : total <= 19 ? "#f97316" : "var(--color-danger)",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((qObj, idx) => {
          const validOptions = qObj.options.filter(Boolean);
          const selectedIdx = getSelectedOptIdx(idx);

          return (
            <div key={idx} className="card" style={{ padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: "0.9rem", marginBottom: "0.875rem", lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-primary-light)", fontWeight: 600, marginRight: "0.5rem" }}>
                  {idx + 1}.
                </span>
                {qObj.q}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {validOptions.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      padding: "0.5rem 0.875rem",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: selectedIdx === optIdx ? "var(--color-primary)" : "var(--color-border)",
                      background: selectedIdx === optIdx ? "rgba(99,102,241,0.12)" : "var(--color-surface-2)",
                      transition: "all 0.2s",
                      fontSize: "0.85rem",
                    }}
                  >
                    <input
                      type="radio"
                      name={`audit-q${idx}`}
                      style={{ accentColor: "var(--color-primary)" }}
                      checked={selectedIdx === optIdx}
                      onChange={() => setAnswer(idx, optIdx)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
