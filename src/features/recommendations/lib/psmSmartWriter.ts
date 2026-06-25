const ARABIC_FILLERS = [
  /\bيوصى\s*ب(?:ـ)?\b/gi,
  /\bيُنصح\s*ب(?:ـ)?\b/gi,
  /\bتنفيذ\s+الإجراء\s+اللازم\s+بشأن\b/gi,
  /\bاتخاذ\s+الإجراء\s+اللازم\s+بشأن\b/gi,
  /\bالإجراء\s+اللازم\b/gi,
  /\bعايزين\b/gi,
  /\bلازم\b/gi,
  /\bضروري\b/gi,
  /\bينبغي\b/gi,
  /\bمطلوب\b/gi,
  /\bيراعى\b/gi,
  /\bيلزم\b/gi,
  /\bبخصوص\b/gi,
  /\bبشأن\b/gi
];

const EN_FILLERS = [
  /\bit is recommended to\b/gi,
  /\bit is necessary to\b/gi,
  /\bit is required to\b/gi,
  /\bensure that\b/gi,
  /\bwe need to\b/gi,
  /\bneed to\b/gi,
  /\bshould\b/gi,
  /\bmust\b/gi,
  /\baction should be taken to\b/gi
];

const ARABIC_ACTION_STARTERS = [
  "تركيب",
  "استبدال",
  "تغيير",
  "تعديل",
  "تحديث",
  "إضافة",
  "توفير",
  "تنفيذ",
  "مراجعة",
  "دراسة",
  "تقييم",
  "فحص",
  "اختبار",
  "معايرة",
  "تدريب",
  "توعية",
  "تحسين",
  "تطوير",
  "إصلاح",
  "رفع",
  "خفض"
];

const EN_ACTION_STARTERS = [
  "implement",
  "install",
  "replace",
  "change",
  "modify",
  "update",
  "add",
  "provide",
  "review",
  "assess",
  "evaluate",
  "inspect",
  "test",
  "calibrate",
  "train",
  "improve",
  "upgrade",
  "develop",
  "repair"
];

function normalizeWhitespace(text: string) {
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*([،,.؛;:])\s*/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function trimEdgePunctuation(text: string) {
  return text.replace(/^[\s.,;:،؛-]+|[\s.,;:،؛-]+$/g, "").trim();
}

function arabicDominant(text: string) {
  const ar = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  return ar >= en;
}

function removeLeadins(text: string, patterns: RegExp[]) {
  return patterns.reduce((acc, pattern) => acc.replace(pattern, " "), text);
}

function sentenceCaseEnglish(text: string) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensureArabicPeriod(text: string) {
  const trimmed = trimEdgePunctuation(text);
  if (!trimmed) return trimmed;
  return /[.!؟]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function ensureEnglishPeriod(text: string) {
  const trimmed = trimEdgePunctuation(text);
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function hasArabicPurpose(text: string) {
  return /(بما يضمن|لضمان|لتمكين|للحد من|بهدف|بما يدعم|بما يحقق)/.test(text);
}

function hasEnglishPurpose(text: string) {
  return /\b(to ensure|to enable|to reduce|to support|to improve|to prevent|to maintain)\b/i.test(text);
}

function chooseArabicOutcome(text: string) {
  if (/(alarm|trip|interlock|dcs|control|كنترول|تحكم|إنذار|انذار|تشابك)/i.test(text)) {
    return "بما يضمن سرعة اكتشاف الانحرافات واتخاذ الإجراء المطلوب في الوقت المناسب";
  }
  if (/(operator|مشغل|اوبيراتور|إجراء|تعليمات|إجراءات|procedure|sop|training|تدريب|توعية)/i.test(text)) {
    return "بما يضمن وضوح أسلوب التشغيل وسرعة الاستجابة التشغيلية";
  }
  if (/(pump|compressor|valve|equipment|معدة|معده|مضخة|طلمبة|ضاغط|صمام|جهاز|معدة)/i.test(text)) {
    return "بما يدعم التشغيل الآمن والاعتمادية التشغيلية";
  }
  if (/(inspection|maintenance|test|calibration|فحص|صيانة|اختبار|معايرة)/i.test(text)) {
    return "بما يضمن الجاهزية التشغيلية والحد من تكرار الأعطال";
  }
  return "بما يضمن تحسين السلامة التشغيلية والحد من تكرار المشكلة";
}

function chooseEnglishOutcome(text: string) {
  if (/(alarm|trip|interlock|dcs|control)/i.test(text)) {
    return "to ensure timely detection of deviations and timely operator response";
  }
  if (/(operator|procedure|sop|training|instruction)/i.test(text)) {
    return "to improve operating clarity and timely response";
  }
  if (/(pump|compressor|valve|equipment|system|device)/i.test(text)) {
    return "to support safe operation and equipment reliability";
  }
  if (/(inspection|maintenance|test|calibration)/i.test(text)) {
    return "to maintain equipment readiness and reduce repeat failures";
  }
  return "to improve process safety and reduce recurrence";
}

function polishArabic(text: string) {
  let next = normalizeWhitespace(text);
  next = removeLeadins(next, ARABIC_FILLERS);
  next = next
    .replace(/\bعلشان\b/gi, "ل")
    .replace(/\bعشان\b/gi, "ل")
    .replace(/\bبحيث\b/gi, "بما يضمن")
    .replace(/\bالاوبيراتور\b/gi, "المشغل")
    .replace(/\bالأوبيراتور\b/gi, "المشغل")
    .replace(/\bالمشغلين\b/gi, "المشغل")
    .replace(/\bيعرف\s+يتعامل\s+معاها\b/gi, "يتمكن المشغل من التعامل معها")
    .replace(/\bيعرف\s+يتعامل\s+معها\b/gi, "يتمكن المشغل من التعامل معها")
    .replace(/\bياخد\s+اكشن\s+سريع\b/gi, "اتخاذ الإجراء المطلوب في الوقت المناسب")
    .replace(/\bأكشن\b/gi, "إجراء")
    .replace(/\bاكشن\b/gi, "إجراء")
    .replace(/\bعليه\s+بسرعة\b/gi, "في الوقت المناسب")
    .replace(/\bفي\s+أسرع\s+وقت\b/gi, "في الوقت المناسب")
    .replace(/\bيعرف\s+يتعامل\b/gi, "يتمكن من التعامل")
    .replace(/\bالمعده\b/gi, "المعدة")
    .replace(/\bالمعده\b/gi, "المعدة")
    .replace(/\s{2,}/g, " ");

  next = trimEdgePunctuation(next);
  if (!next) return "";

  const startsWithAction = ARABIC_ACTION_STARTERS.some((starter) => next.startsWith(starter));
  if (!startsWithAction) {
    next = `مراجعة ${next}`;
  }

  if (!hasArabicPurpose(next)) {
    next = `${next} ${chooseArabicOutcome(next)}`;
  }

  next = next
    .replace(/\bمراجعة دراسة\b/g, "دراسة")
    .replace(/\bمراجعة تقييم\b/g, "تقييم")
    .replace(/\bمراجعة تنفيذ\b/g, "تنفيذ")
    .replace(/\bمراجعة تركيب\b/g, "تركيب")
    .replace(/\bل يتمكن\b/g, "لتمكين")
    .replace(/\s{2,}/g, " ");

  return ensureArabicPeriod(next);
}

function polishEnglish(text: string) {
  let next = normalizeWhitespace(text);
  next = removeLeadins(next, EN_FILLERS);
  next = next
    .replace(/\bso that\b/gi, "to")
    .replace(/\bquick action\b/gi, "timely action")
    .replace(/\boperator can deal with it\b/gi, "operators can handle it safely")
    .replace(/\boperator knows how to deal with it\b/gi, "operators can handle it safely")
    .replace(/\s{2,}/g, " ");

  next = trimEdgePunctuation(next);
  if (!next) return "";

  const startsWithAction = EN_ACTION_STARTERS.some((starter) => next.toLowerCase().startsWith(starter));
  if (!startsWithAction) {
    next = `Review ${next}`;
  }

  if (!hasEnglishPurpose(next)) {
    next = `${next} ${chooseEnglishOutcome(next)}`;
  }

  next = sentenceCaseEnglish(next).replace(/\s{2,}/g, " ");
  return ensureEnglishPeriod(next);
}

export function rewriteRecommendationWithSmartWriter(inputText: string) {
  const normalized = normalizeWhitespace(inputText);
  if (!normalized) {
    throw new Error("Recommendation text is required.");
  }

  const rewritten = arabicDominant(normalized)
    ? polishArabic(normalized)
    : polishEnglish(normalized);

  if (!rewritten) {
    throw new Error("Could not improve the recommendation text.");
  }

  return rewritten;
}
