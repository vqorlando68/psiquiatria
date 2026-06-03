import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PsiEval — Evaluación Psiquiátrica",
  description:
    "Sistema clínico bilingüe de evaluación psiquiátrica con escalas estandarizadas (PHQ-9, GAD-7, MMSE, AUDIT, PANSS) y examen del estado mental.",
  keywords: ["psiquiatría", "evaluación clínica", "PHQ-9", "GAD-7", "MMSE", "PANSS"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
