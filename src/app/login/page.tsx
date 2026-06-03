"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error === "server_error" ? t("serverError") : t("error"));
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("serverError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 60% 20%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(6,182,212,0.08) 0%, transparent 50%), var(--color-bg)",
        padding: "1.5rem",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translate(-50%, 0)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "2rem",
              boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
            }}
          >
            🧠
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.25rem" }}>
            PsiEval
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            {t("subtitle")}
          </p>
        </div>

        {/* Card */}
        <div
          className="card-glass"
          style={{ padding: "2rem" }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1.5rem", textAlign: "center" }}>
            {t("title")}
          </h2>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                {t("username")}
              </label>
              <input
                id="username"
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                  {t("loading")}
                </>
              ) : (
                <>🔐 {t("submit")}</>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
          Sistema Clínico Psiquiátrico © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
