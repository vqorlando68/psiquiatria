"use client";

import { useTranslations } from "next-intl";
import { PANSSResult } from "@/lib/types";

interface PANSSProps {
  data: PANSSResult;
  onChange: (data: PANSSResult) => void;
}

const RATINGS = [1, 2, 3, 4, 5, 6, 7];
const RATING_COLORS: Record<number, string> = {
  1: "var(--color-success)",
  2: "#34d399",
  3: "#fcd34d",
  4: "var(--color-warning)",
  5: "#f97316",
  6: "#f87171",
  7: "var(--color-danger)",
};

export default function PANSSScale({ data, onChange }: PANSSProps) {
  const t = useTranslations("panss");
  const positiveItems = t.raw("positive.items") as string[];
  const negativeItems = t.raw("negative.items") as string[];
  const generalItems = t.raw("general.items") as string[];

  function setPositive(idx: number, val: number) {
    const next = [...data.positive];
    next[idx] = val;
    const positiveTotal = next.reduce((s, a) => s + a, 0);
    onChange({ ...data, positive: next, positiveTotal, compositeIndex: positiveTotal - data.negativeTotal, total: positiveTotal + data.negativeTotal + data.generalTotal });
  }

  function setNegative(idx: number, val: number) {
    const next = [...data.negative];
    next[idx] = val;
    const negativeTotal = next.reduce((s, a) => s + a, 0);
    onChange({ ...data, negative: next, negativeTotal, compositeIndex: data.positiveTotal - negativeTotal, total: data.positiveTotal + negativeTotal + data.generalTotal });
  }

  function setGeneral(idx: number, val: number) {
    const next = [...data.general];
    next[idx] = val;
    const generalTotal = next.reduce((s, a) => s + a, 0);
    onChange({ ...data, general: next, generalTotal, total: data.positiveTotal + data.negativeTotal + generalTotal });
  }

  function RatingRow({
    label,
    value,
    onSet,
  }: {
    label: string;
    value: number;
    onSet: (v: number) => void;
  }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.625rem 0",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span style={{ flex: 1, fontSize: "0.875rem", lineHeight: 1.4 }}>{label}</span>
        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => onSet(r)}
              title={t(`ratingScale.${r}`)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "7px",
                border: "1px solid",
                borderColor: value === r ? RATING_COLORS[r] : "var(--color-border)",
                background: value === r ? `${RATING_COLORS[r]}25` : "var(--color-surface-2)",
                color: value === r ? RATING_COLORS[r] : "var(--color-text-dim)",
                fontWeight: value === r ? 700 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function ScoreChip({ label, value, max }: { label: string; value: number; max: number }) {
    const pct = ((value - max * 0.14) / (max * 0.86)) * 100;
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-light)" }}>{value}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{label}</div>
        <div style={{ height: "4px", background: "var(--color-surface-3)", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.max(0, pct)}%`, background: "var(--color-primary)", borderRadius: "2px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("title")}</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{t("instructions")}</p>
        {/* Rating legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.75rem" }}>
          {RATINGS.map((r) => (
            <span
              key={r}
              style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "5px",
                background: `${RATING_COLORS[r]}20`,
                color: RATING_COLORS[r],
                border: `1px solid ${RATING_COLORS[r]}40`,
              }}
            >
              {t(`ratingScale.${r}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Score summary */}
      <div className="card" style={{ background: "var(--color-surface-2)", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "space-around" }}>
          <ScoreChip label={t("scores.positive")} value={data.positiveTotal} max={49} />
          <ScoreChip label={t("scores.negative")} value={data.negativeTotal} max={49} />
          <ScoreChip label={t("scores.general")} value={data.generalTotal} max={112} />
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: data.compositeIndex >= 0 ? "var(--color-primary-light)" : "var(--color-danger)",
            }}>
              {data.compositeIndex > 0 ? "+" : ""}{data.compositeIndex}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{t("scores.composite")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text)" }}>{data.total}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{t("scores.total")} / 210</div>
          </div>
        </div>
      </div>

      {/* Positive Scale */}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f87171", marginBottom: "0.75rem" }}>
          🔴 {t("positive.title")}
        </h3>
        {positiveItems.map((item, idx) => (
          <RatingRow key={idx} label={item} value={data.positive[idx] || 1} onSet={(v) => setPositive(idx, v)} />
        ))}
      </div>

      {/* Negative Scale */}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-accent)", marginBottom: "0.75rem" }}>
          🔵 {t("negative.title")}
        </h3>
        {negativeItems.map((item, idx) => (
          <RatingRow key={idx} label={item} value={data.negative[idx] || 1} onSet={(v) => setNegative(idx, v)} />
        ))}
      </div>

      {/* General Scale */}
      <div className="card">
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-warning)", marginBottom: "0.75rem" }}>
          🟡 {t("general.title")}
        </h3>
        {generalItems.map((item, idx) => (
          <RatingRow key={idx} label={item} value={data.general[idx] || 1} onSet={(v) => setGeneral(idx, v)} />
        ))}
      </div>
    </div>
  );
}
