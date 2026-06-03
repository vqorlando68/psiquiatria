"use client";

import { useTranslations } from "next-intl";
import { MMSEResult } from "@/lib/types";

interface MMSEProps {
  data: MMSEResult;
  onChange: (data: MMSEResult) => void;
}

const ITEM_MAX = [1,1,1,1,1, 1,1,1,1,1, 3,5,3, 2,1,3,1,1,1];

export default function MMSEScale({ data, onChange }: MMSEProps) {
  const t = useTranslations("mmse");
  const items = t.raw("items") as Array<{ section: string; q: string; max: number }>;

  // Group items by section
  const sectionKeys = ["orientation_time", "orientation_place", "registration", "attention", "recall", "language", "construction"];
  const sectionBounds: Record<string, number[]> = {
    orientation_time:  [0, 4],
    orientation_place: [5, 9],
    registration:      [10, 10],
    attention:         [11, 11],
    recall:            [12, 12],
    language:          [13, 17],
    construction:      [18, 18],
  };

  function setScore(idx: number, val: number) {
    const maxVal = ITEM_MAX[idx];
    const clamped = Math.min(Math.max(0, val), maxVal);
    const next = [...data.scores];
    next[idx] = clamped;
    const newTotal = next.reduce((s, a) => s + a, 0);
    let interpretation = "normal";
    if (newTotal < 11) interpretation = "severe";
    else if (newTotal < 21) interpretation = "moderate";
    else if (newTotal < 27) interpretation = "mild";
    onChange({ scores: next, total: newTotal, interpretation });
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
              color: `var(--color-severity-${data.interpretation})`,
              lineHeight: 1,
            }}
          >
            {data.total}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>/ 30</div>
        </div>
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
            {t("score")}
          </div>
          <span className={`badge badge-${data.interpretation}`}>
            {t(`interpretation.${data.interpretation}`)}
          </span>
        </div>
        {/* Section subtotals */}
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {sectionKeys.map((sec) => {
            const [start, end] = sectionBounds[sec];
            const secTotal = data.scores.slice(start, end + 1).reduce((s, a) => s + (a || 0), 0);
            const secMax = ITEM_MAX.slice(start, end + 1).reduce((s, a) => s + a, 0);
            return (
              <div
                key={sec}
                style={{
                  fontSize: "0.7rem",
                  background: "var(--color-surface-3)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "6px",
                  color: "var(--color-text-muted)",
                }}
              >
                {t(`sections.${sec}`)}: <strong style={{ color: "var(--color-text)" }}>{secTotal}/{secMax}</strong>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items by section */}
      {sectionKeys.map((sec) => {
        const [start, end] = sectionBounds[sec];
        const secItems = items.slice(start, end + 1);
        return (
          <div key={sec} className="card" style={{ padding: "1.25rem" }}>
            <h3
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-primary-light)",
                marginBottom: "1rem",
              }}
            >
              {t(`sections.${sec}`)}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {secItems.map((item, relIdx) => {
                const absIdx = start + relIdx;
                const maxVal = ITEM_MAX[absIdx];
                const current = data.scores[absIdx] ?? 0;
                return (
                  <div key={absIdx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <p style={{ fontSize: "0.875rem", flex: 1, lineHeight: 1.5 }}>
                      {item.q}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      {maxVal <= 5 ? (
                        // Numeric pill selector for small ranges
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {Array.from({ length: maxVal + 1 }, (_, i) => i).map((val) => (
                            <button
                              key={val}
                              onClick={() => setScore(absIdx, val)}
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                border: "1px solid",
                                borderColor: current === val ? "var(--color-primary)" : "var(--color-border)",
                                background: current === val ? "var(--color-primary)" : "var(--color-surface-2)",
                                color: current === val ? "white" : "var(--color-text-muted)",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      ) : (
                        // For MMSE item 11 (Serial 7s, max=5) — same pill selector
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {Array.from({ length: maxVal + 1 }, (_, i) => i).map((val) => (
                            <button
                              key={val}
                              onClick={() => setScore(absIdx, val)}
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                border: "1px solid",
                                borderColor: current === val ? "var(--color-primary)" : "var(--color-border)",
                                background: current === val ? "var(--color-primary)" : "var(--color-surface-2)",
                                color: current === val ? "white" : "var(--color-text-muted)",
                                fontWeight: 600,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", minWidth: "30px" }}>
                        /{maxVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
