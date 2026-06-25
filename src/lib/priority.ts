export const PRIORITY_META = {
  critical: {
    badge: "P1",
    name: "Serious",
    label: "P1 — Serious",
    tone: "red"
  },
  high: {
    badge: "P2",
    name: "High",
    label: "P2 — High",
    tone: "amber"
  },
  medium: {
    badge: "P3",
    name: "Medium",
    label: "P3 — Medium",
    tone: "blue"
  },
  low: {
    badge: "P4",
    name: "Low",
    label: "P4 — Low",
    tone: "green"
  }
} as const;

export type PriorityCode = keyof typeof PRIORITY_META;

function normalizePriorityCode(code: string | null | undefined): PriorityCode | null {
  if (!code) return null;
  const normalized = code.trim().toLowerCase();
  if (normalized in PRIORITY_META) return normalized as PriorityCode;
  return null;
}

export function getPriorityBadgeLabel(code: string | null | undefined, fallbackName?: string | null) {
  const normalized = normalizePriorityCode(code);
  if (normalized) return PRIORITY_META[normalized].badge;
  return fallbackName || code || "—";
}

export function getPriorityPlainName(code: string | null | undefined, fallbackName?: string | null) {
  const normalized = normalizePriorityCode(code);
  if (normalized) return PRIORITY_META[normalized].name;
  return fallbackName || code || "—";
}

export function getPriorityDisplayLabel(code: string | null | undefined, fallbackName?: string | null) {
  const normalized = normalizePriorityCode(code);
  if (normalized) return PRIORITY_META[normalized].label;
  return fallbackName || code || "—";
}

export function getPriorityTone(code: string | null | undefined) {
  const normalized = normalizePriorityCode(code);
  return normalized ? PRIORITY_META[normalized].tone : "slate";
}
