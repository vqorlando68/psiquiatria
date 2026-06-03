"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function Navbar({ username }: { username: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [langLoading, setLangLoading] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchLanguage(locale: "es" | "en") {
    setLangLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    router.refresh();
    setLangLoading(false);
  }

  const links = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "🏠" },
    { href: "/evaluation/new", label: t("nav.newEvaluation"), icon: "📋" },
    { href: "/viewer", label: t("nav.viewer"), icon: "📂" },
  ];

  return (
    <nav className="navbar">
      <Link href="/dashboard" className="nav-logo">
        <div className="nav-logo-icon">🧠</div>
        <span className="nav-logo-text">PsiEval</span>
      </Link>

      <div className="nav-links" style={{ flex: 1, justifyContent: "center" }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${pathname.startsWith(link.href) ? "active" : ""}`}
          >
            <span style={{ marginRight: "0.3rem" }}>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Language switcher */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            onClick={() => switchLanguage("es")}
            disabled={langLoading}
            className="btn btn-ghost btn-sm"
            title="Español"
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
          >
            🇪🇸
          </button>
          <button
            onClick={() => switchLanguage("en")}
            disabled={langLoading}
            className="btn btn-ghost btn-sm"
            title="English"
            style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
          >
            🇬🇧
          </button>
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            padding: "0.3rem 0.5rem",
            background: "var(--color-surface-2)",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
          }}
        >
          👤 {username}
        </div>

        <button onClick={handleLogout} className="btn btn-ghost btn-sm">
          {t("nav.logout")}
        </button>
      </div>
    </nav>
  );
}
