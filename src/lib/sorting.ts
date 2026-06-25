export type SortDirection = "asc" | "desc";

export type SortConfig<K extends string> = {
  key: K;
  direction: SortDirection;
};

export function nextSortConfig<K extends string>(current: SortConfig<K>, key: K): SortConfig<K> {
  if (current.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

export function normalizeSortValue(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  const text = String(value).trim();
  if (!text) return "";

  const numeric = Number(text.replace(/,/g, ""));
  if (Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(text.replace(/,/g, ""))) return numeric;

  const timestamp = Date.parse(text);
  if (!Number.isNaN(timestamp) && /\d{4}|\d{1,2}\s+[A-Za-z]{3,}/.test(text)) return timestamp;

  return text.toLocaleLowerCase();
}

export function compareSortValues(a: unknown, b: unknown, direction: SortDirection = "asc") {
  const first = normalizeSortValue(a);
  const second = normalizeSortValue(b);

  let result = 0;
  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else {
    result = String(first).localeCompare(String(second), undefined, {
      numeric: true,
      sensitivity: "base"
    });
  }

  return direction === "asc" ? result : -result;
}

export function sortByConfig<T, K extends string>(
  rows: T[],
  config: SortConfig<K>,
  selector: (row: T, key: K) => unknown
) {
  return [...rows].sort((a, b) => compareSortValues(selector(a, config.key), selector(b, config.key), config.direction));
}
