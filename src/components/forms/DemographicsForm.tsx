"use client";

import { useTranslations } from "next-intl";
import { Demographics } from "@/lib/types";

interface Props {
  data: Demographics;
  onChange: (data: Demographics) => void;
}

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const dob = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export default function DemographicsForm({ data, onChange }: Props) {
  const t = useTranslations("demographics");

  function update<K extends keyof Demographics>(key: K, val: Demographics[K]) {
    onChange({ ...data, [key]: val });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.25rem" }}>{t("title")}</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Complete los datos demográficos del paciente a evaluar.
        </p>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="firstName">{t("firstName")} *</label>
          <input
            id="firstName"
            type="text"
            className="form-control"
            value={data.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="lastName">{t("lastName")} *</label>
          <input
            id="lastName"
            type="text"
            className="form-control"
            value={data.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="birthDate">{t("birthDate")} *</label>
          <input
            id="birthDate"
            type="date"
            className="form-control"
            value={data.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t("age")}</label>
          <input
            type="text"
            className="form-control"
            value={data.birthDate ? `${calcAge(data.birthDate)} años` : "—"}
            readOnly
            style={{ opacity: 0.7, cursor: "default" }}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="evaluationDate">{t("evaluationDate")} *</label>
          <input
            id="evaluationDate"
            type="date"
            className="form-control"
            value={data.evaluationDate}
            onChange={(e) => update("evaluationDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="sex">{t("sex")} *</label>
          <select
            id="sex"
            className="form-control"
            value={data.sex}
            onChange={(e) => update("sex", e.target.value as Demographics["sex"])}
          >
            <option value="M">{t("sexOptions.M")}</option>
            <option value="F">{t("sexOptions.F")}</option>
            <option value="O">{t("sexOptions.O")}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="maritalStatus">{t("maritalStatus")} *</label>
          <select
            id="maritalStatus"
            className="form-control"
            value={data.maritalStatus}
            onChange={(e) => update("maritalStatus", e.target.value as Demographics["maritalStatus"])}
          >
            <option value="S">{t("maritalOptions.S")}</option>
            <option value="C">{t("maritalOptions.C")}</option>
            <option value="D">{t("maritalOptions.D")}</option>
            <option value="V">{t("maritalOptions.V")}</option>
            <option value="U">{t("maritalOptions.U")}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="education">{t("education")} *</label>
          <select
            id="education"
            className="form-control"
            value={data.education}
            onChange={(e) => update("education", e.target.value as Demographics["education"])}
          >
            {(["none", "primary", "secondary", "highschool", "technical", "university", "postgrad"] as const).map(
              (k) => (
                <option key={k} value={k}>{t(`educationOptions.${k}`)}</option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="occupation">{t("occupation")}</label>
          <input
            id="occupation"
            type="text"
            className="form-control"
            value={data.occupation}
            onChange={(e) => update("occupation", e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="phone">{t("phone")}</label>
          <input
            id="phone"
            type="tel"
            className="form-control"
            value={data.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
