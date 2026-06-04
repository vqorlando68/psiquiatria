// Type definitions for the evaluation data model

export interface Demographics {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date string
  age?: number;
  sex: "M" | "F" | "O";
  maritalStatus: "S" | "C" | "D" | "V" | "U";
  education: "none" | "primary" | "secondary" | "highschool" | "technical" | "university" | "postgrad";
  occupation: string;
  phone?: string;
  email?: string;
  evaluationDate: string; // ISO date string
}

export interface ChiefComplaint {
  complaint: string;
  duration: string;
  mainSymptoms: string;
}

export interface ScaleResult {
  answers: number[];
  total: number;
  interpretation: string;
}

export interface PANSSResult {
  positive: number[];
  negative: number[];
  general: number[];
  positiveTotal: number;
  negativeTotal: number;
  generalTotal: number;
  compositeIndex: number;
  total: number;
}

export interface MMSEResult {
  scores: number[]; // one score per item (0 or max of that item)
  total: number;
  interpretation: string;
}

export interface MSEData {
  appearance: string;
  attitude: string;
  psychomotor: string;
  speech: string;
  affect: string;
  mood: string;
  thoughtProcess: string;
  thoughtContent: string;
  perceptions: string;
  cognition: string;
  insight: string;
  judgment: string;
}

export interface Diagnosis {
  cie11Code: string;
  cie11Description: string;
  additionalNotes: string;
}

export interface EvaluationData {
  id?: number;
  evaluator?: string;
  demographics: Demographics;
  chiefComplaint: ChiefComplaint;
  phq9: ScaleResult;
  gad7: ScaleResult;
  audit: ScaleResult;
  mmse: MMSEResult;
  panss: PANSSResult;
  mse: MSEData;
  diagnosis: Diagnosis;
  createdAt?: string;
}

export type WizardStep =
  | "phq9"
  | "gad7"
  | "audit"
  | "mmse"
  | "panss"
  | "mse"
  | "diagnosis"
  | "summary";

export const WIZARD_STEPS: WizardStep[] = [
  "phq9",
  "gad7",
  "audit",
  "mmse",
  "panss",
  "mse",
  "diagnosis",
  "summary",
];

// Scoring helpers

export function scorePHQ9(answers: number[]): { total: number; interpretation: string } {
  const total = answers.reduce((s, a) => s + a, 0);
  let interpretation: string;
  if (total <= 4) interpretation = "minimal";
  else if (total <= 9) interpretation = "mild";
  else if (total <= 14) interpretation = "moderate";
  else if (total <= 19) interpretation = "moderatelySevere";
  else interpretation = "severe";
  return { total, interpretation };
}

export function scoreGAD7(answers: number[]): { total: number; interpretation: string } {
  const total = answers.reduce((s, a) => s + a, 0);
  let interpretation: string;
  if (total <= 4) interpretation = "minimal";
  else if (total <= 9) interpretation = "mild";
  else if (total <= 14) interpretation = "moderate";
  else interpretation = "severe";
  return { total, interpretation };
}

export function scoreAUDIT(answers: number[]): { total: number; interpretation: string } {
  // Items 9 & 10 are scored 0, 2, or 4
  const total = answers.reduce((s, a) => s + a, 0);
  let interpretation: string;
  if (total <= 7) interpretation = "low";
  else if (total <= 15) interpretation = "hazardous";
  else if (total <= 19) interpretation = "harmful";
  else interpretation = "dependent";
  return { total, interpretation };
}

export function scoreMMSE(scores: number[]): { total: number; interpretation: string } {
  const total = scores.reduce((s, a) => s + a, 0);
  let interpretation: string;
  if (total >= 27) interpretation = "normal";
  else if (total >= 21) interpretation = "mild";
  else if (total >= 11) interpretation = "moderate";
  else interpretation = "severe";
  return { total, interpretation };
}

export function scorePANSS(positive: number[], negative: number[], general: number[]): PANSSResult {
  const positiveTotal = positive.reduce((s, a) => s + a, 0);
  const negativeTotal = negative.reduce((s, a) => s + a, 0);
  const generalTotal = general.reduce((s, a) => s + a, 0);
  const compositeIndex = positiveTotal - negativeTotal;
  const total = positiveTotal + negativeTotal + generalTotal;
  return { positive, negative, general, positiveTotal, negativeTotal, generalTotal, compositeIndex, total };
}
