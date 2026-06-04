"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface Patient {
  ID: number;
  NOMBRE_COMPLETO: string;
  CORREO_ELECTRONICO: string;
  TELEFONO: string;
  IDENTIFICACION: string;
}

export default function SelectPatientPage() {
  const t = useTranslations();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients("");
  }, []);

  async function fetchPatients(searchQuery: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("failed_fetch");
      const data = await res.json();
      setPatients(data.patients || []);
    } catch {
      setError("Error al cargar la lista de pacientes.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    fetchPatients(val);
  }

  function handleStartEvaluation() {
    if (!selectedPatient) return;
    // Open the evaluation wizard in a new tab/window
    window.open(`/evaluation/run?patientId=${selectedPatient.ID}`, "_blank");
    // Redirect back to dashboard in this tab
    router.push("/dashboard");
  }

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">👤 Selección de Paciente</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Seleccione el paciente para el cual desea iniciar la prueba clínica de evaluación.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Left column: Search and list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="search-patient" style={{ fontWeight: 600 }}>
              Buscar paciente por nombre o apellido
            </label>
            <input
              id="search-patient"
              type="text"
              className="form-control"
              placeholder="Ej: Juan Pérez..."
              value={query}
              onChange={handleSearchChange}
              style={{
                fontSize: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
              }}
            />
          </div>

          <div
            className="card"
            style={{
              flex: 1,
              padding: "0.5rem",
              maxHeight: "350px",
              overflowY: "auto",
              background: "var(--color-surface-2)",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              borderRadius: "12px",
            }}
          >
            {loading && patients.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-dim)" }}>
                Cargando pacientes...
              </div>
            )}

            {!loading && patients.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-dim)" }}>
                No se encontraron pacientes que coincidan con la búsqueda.
              </div>
            )}

            {error && (
              <div style={{ padding: "1rem", color: "var(--color-severity-severe)", textAlign: "center" }}>
                {error}
              </div>
            )}

            {patients.map((p) => {
              const isSelected = selectedPatient?.ID === p.ID;
              return (
                <button
                  key={p.ID}
                  onClick={() => setSelectedPatient(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    width: "100%",
                    padding: "0.875rem 1rem",
                    border: "none",
                    borderRadius: "8px",
                    background: isSelected ? "var(--color-primary)" : "transparent",
                    color: isSelected ? "#fff" : "var(--color-text)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className={`patient-list-item ${isSelected ? "" : "hover-surface-3"}`}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.2)" : "var(--color-surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                    }}
                  >
                    {p.NOMBRE_COMPLETO.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                      {p.NOMBRE_COMPLETO}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-muted)",
                        marginTop: "0.15rem",
                      }}
                    >
                      ID: #{p.ID} • Tel: {p.TELEFONO || "—"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Details and Actions */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {selectedPatient ? (
            <div
              className="card animate-fade-in"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                height: "100%",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "16px",
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    background: "var(--color-primary-light)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                  }}
                >
                  {selectedPatient.NOMBRE_COMPLETO.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                    {selectedPatient.NOMBRE_COMPLETO}
                  </h3>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    ID: #{selectedPatient.ID}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  padding: "1.25rem",
                  background: "var(--color-surface-2)",
                  borderRadius: "12px",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Nombres y Apellidos
                  </label>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.25rem" }}>
                    {selectedPatient.NOMBRE_COMPLETO}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Identificación
                  </label>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.25rem" }}>
                    {selectedPatient.IDENTIFICACION || "—"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Correo Electrónico
                  </label>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.25rem" }}>
                    {selectedPatient.CORREO_ELECTRONICO || "—"}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Teléfono
                  </label>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.25rem" }}>
                    {selectedPatient.TELEFONO || "—"}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  className="btn btn-primary"
                  onClick={handleStartEvaluation}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  🚀 Iniciar Evaluación en otra pestaña ↗
                </button>
              </div>
            </div>
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                height: "100%",
                background: "var(--color-surface-2)",
                border: "1px dashed var(--color-border)",
                borderRadius: "16px",
                padding: "2rem",
                textAlign: "center",
                color: "var(--color-text-dim)",
              }}
            >
              <div style={{ fontSize: "3rem" }}>👈</div>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Ningún paciente seleccionado</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Seleccione un paciente de la lista de la izquierda para ver su información demográfica e iniciar la evaluación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
