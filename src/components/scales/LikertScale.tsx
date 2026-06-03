"use client";

import { useTranslations } from "next-intl";

/**
 * Reusable Likert-based scale component (for PHQ-9, GAD-7)
 */
interface LikertScaleProps {
  namespace: "phq9" | "gad7";
  answers: number[];
  onChange: (answers: number[]) => void;
  total: number;
  interpretation: string;
}

const OPTION_COLORS: Record<number, string> = {
  0: "var(--color-success)",
  1: "var(--color-warning)",
  2: "#f97316",
  3: "var(--color-danger)",
};

export default function LikertScale({ namespace, answers, onChange, total, interpretation }: LikertScaleProps) {
  const t = useTranslations(namespace);
  const questions = t.raw("questions") as string[];
  const options = [0, 1, 2, 3];
  const maxScore = namespace === "phq9" ? 27 : 21;

  function setAnswer(idx: number, val: number) {
    const next = [...answers];
    next[idx] = val;
    onChange(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("title")}</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{t("instructions")}</p>
      </div>

      {/* Score display */}
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
              color: `var(--color-severity-${interpretation})`,
              lineHeight: 1,
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>/ {maxScore}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
            {t("score")}
          </div>
          <div>
            <span className={`badge badge-${interpretation}`}>
              {t(`interpretation.${interpretation}`)}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "8px",
              background: "var(--color-surface-3)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(total / maxScore) * 100}%`,
                background: `var(--color-severity-${interpretation})`,
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((question, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              padding: "1rem 1.25rem",
              borderLeft: answers[idx] >= 0 ? `3px solid ${OPTION_COLORS[answers[idx]] ?? "transparent"}` : "3px solid transparent",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <p style={{ fontSize: "0.9rem", flex: 1, lineHeight: 1.5 }}>
                <span style={{ color: "var(--color-primary-light)", fontWeight: 600, marginRight: "0.5rem" }}>
                  {idx + 1}.
                </span>
                {question}
              </p>
              <div className="likert-group" style={{ flexShrink: 0 }}>
                {options.map((opt) => (
                  <label key={opt} className="likert-option" title={t(`options.${opt}`)}>
                    <input
                      type="radio"
                      name={`${namespace}-q${idx}`}
                      value={opt}
                      checked={answers[idx] === opt}
                      onChange={() => setAnswer(idx, opt)}
                    />
                    <div className="likert-box">{opt}</div>
                    <span className="likert-label">{t(`options.${opt}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
