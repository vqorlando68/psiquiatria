"use client";

import { useTranslations } from "next-intl";
import { MSEData } from "@/lib/types";

interface MSEFormProps {
  data: MSEData;
  onChange: (data: MSEData) => void;
}

const MSE_FIELDS: (keyof MSEData)[] = [
  "appearance",
  "attitude",
  "psychomotor",
  "speech",
  "affect",
  "mood",
  "thoughtProcess",
  "thoughtContent",
  "perceptions",
  "cognition",
  "insight",
  "judgment",
];

const FIELD_ICONS: Record<keyof MSEData, string> = {
  appearance: "👁",
  attitude: "🤝",
  psychomotor: "🏃",
  speech: "💬",
  affect: "😊",
  mood: "❤️",
  thoughtProcess: "🧩",
  thoughtContent: "💭",
  perceptions: "👂",
  cognition: "🧠",
  insight: "🔍",
  judgment: "⚖️",
};

export default function MSEForm({ data, onChange }: MSEFormProps) {
  const t = useTranslations("mse");

  function update(field: keyof MSEData, val: string) {
    onChange({ ...data, [field]: val });
  }

  const filledCount = MSE_FIELDS.filter((f) => data[f]?.trim()).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>{t("title")}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Complete el examen del estado mental estructurado.
          </p>
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "6px",
              background: "rgba(99,102,241,0.1)",
              color: "var(--color-primary-light)",
              border: "1px solid var(--color-border)",
              whiteSpace: "nowrap",
            }}
          >
            {filledCount}/{MSE_FIELDS.length} completados
          </span>
        </div>
      </div>

      <div className="mse-grid">
        {MSE_FIELDS.map((field) => (
          <div key={field} className="form-group">
            <label className="form-label" htmlFor={`mse-${field}`}>
              <span style={{ marginRight: "0.3rem" }}>{FIELD_ICONS[field]}</span>
              {t(`sections.${field}`)}
            </label>
            <textarea
              id={`mse-${field}`}
              className="form-control"
              value={data[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={t(`placeholders.${field}`)}
              rows={3}
              style={{ minHeight: "80px", resize: "vertical" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
