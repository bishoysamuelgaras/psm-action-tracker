export function getSourceDisplayNo(
  sourceNo: string | null | undefined,
  referenceNo?: string | null
) {
  const normalizedSourceNo = (sourceNo ?? "").trim();
  if (normalizedSourceNo) return normalizedSourceNo;

  const normalizedReferenceNo = (referenceNo ?? "").trim();
  if (normalizedReferenceNo) return normalizedReferenceNo;

  return "—";
}
