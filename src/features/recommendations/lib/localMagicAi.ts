function normalizeWhitespace(value: string) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ ]*\n[ ]*/g, "\n")
    .trim();
}

function startsWithArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.،,;؛:\-\s]+$/g, "").trim();
}

/**
 * Local browser LLM was removed from the production bundle/dependencies because
 * @huggingface/transformers is very large and can cause slow or stalled npm installs
 * on Netlify/Windows/OneDrive environments. This lightweight fallback keeps the
 * feature stable without loading any model at build or install time.
 */
export function isLocalMagicAiSupported() {
  return true;
}

export async function rewriteRecommendationWithLocalAi(inputText: string) {
  const text = normalizeWhitespace(inputText);
  if (!text) {
    throw new Error("Recommendation text is required.");
  }

  const cleaned = trimTrailingPunctuation(text);

  if (startsWithArabic(cleaned)) {
    return cleaned.startsWith("يجب") || cleaned.startsWith("ضرورة")
      ? `${cleaned}.`
      : `ضرورة ${cleaned}.`;
  }

  return cleaned.match(/^(ensure|perform|review|install|update|verify|prepare|implement|conduct|provide)\b/i)
    ? `${cleaned}.`
    : `Ensure ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}.`;
}
