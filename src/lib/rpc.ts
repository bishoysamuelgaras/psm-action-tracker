import { supabase } from "@/lib/supabase";

type RpcCall<TArgs extends Record<string, unknown>> = {
  fn: string;
  args: TArgs;
};

type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function extractTextResult(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.length ? extractTextResult(value[0]) : "";
  }
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    const candidates = [
      row.reserved_number,
      row.reserved_no,
      row.reservedNumber,
      row.number,
      row.value,
      row.result
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }
  return "";
}

function isSchemaCacheMiss(error: PostgrestErrorLike | null): boolean {
  return error?.code === "PGRST202" || error?.code === "PGRST203";
}

export async function callReservedNumberRpc<TArgs extends Record<string, unknown>>(
  calls: RpcCall<TArgs>[],
  fallbackLabel: string
): Promise<string> {
  let lastError: PostgrestErrorLike | null = null;

  for (const call of calls) {
    const { data, error } = await (supabase as any).rpc(call.fn, call.args);

    if (!error) {
      const value = extractTextResult(data);
      if (value.trim()) return value;
      throw new Error(`The server did not return a ${fallbackLabel}.`);
    }

    lastError = error as PostgrestErrorLike;
    if (!isSchemaCacheMiss(lastError)) {
      throw error;
    }
  }

  const message = lastError?.message || `Could not reserve ${fallbackLabel}.`;
  throw new Error(
    `${message} Run supabase/sql/011_fix_reserved_numbering_rpc_v2.sql then refresh the app.`
  );
}
