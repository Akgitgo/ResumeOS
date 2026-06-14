// Lightweight, dependency-free keyword extraction & fuzzy matching.
// Avoids heavy NLP libs so the whole pipeline can run client-side too.

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","for","to","of","in","on",
  "at","by","with","from","as","is","are","was","were","be","been","being",
  "this","that","these","those","it","its","you","your","we","our","they",
  "their","will","shall","may","can","could","would","should","must","not",
  "no","do","does","did","have","has","had","into","about","over","under",
  "than","also","such","etc","per","via","across","within","using","use",
  "responsible","including","include","includes","ability","work","working",
  "role","job","team","experience","years","year","strong","good","excellent",
]);

// Very small stemmer: strips common suffixes so "developing"/"developed"/
// "develops" all collapse to "develop". Not linguistically perfect but good
// enough for fuzzy keyword overlap.
export function stem(word: string): string {
  let w = word.toLowerCase();
  const suffixes = ["ing", "edly", "ed", "ies", "es", "s", "ly", "ment", "ers", "er"];
  for (const suf of suffixes) {
    if (w.length - suf.length > 2 && w.endsWith(suf)) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

// Extracts candidate keywords/phrases (1-3 grams) from a job description,
// ranked by frequency. Returns top N unique terms.
export function extractKeywords(jdText: string, topN = 40): string[] {
  const tokens = tokenize(jdText);
  const freq = new Map<string, number>();

  // unigrams
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);

  // bigrams & trigrams (often capture skill phrases like "machine learning",
  // "project management")
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const gram = tokens.slice(i, i + n).join(" ");
      freq.set(gram, (freq.get(gram) || 0) + 1);
    }
  }

  return [...freq.entries()]
    .filter(([term, count]) => count >= 1 && term.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term]) => term);
}

// Levenshtein distance, used for fuzzy/semantic matching of single words.
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// Returns true if `keyword` appears in `resumeText`, either exactly or
// (for multi-word phrases) via stemmed token overlap, or (for single words)
// via small edit-distance tolerance.
export function isKeywordPresent(
  keyword: string,
  resumeText: string,
  mode: "exact" | "semantic" | "hybrid"
): "exact" | "fuzzy" | "absent" {
  const lowerResume = resumeText.toLowerCase();

  if (lowerResume.includes(keyword)) return "exact";
  if (mode === "exact") return "absent";

  const kwTokens = keyword.split(" ").map(stem);
  const resumeTokens = new Set(tokenize(resumeText).map(stem));

  const allStemmedPresent = kwTokens.every((t) => resumeTokens.has(t));
  if (allStemmedPresent) return "fuzzy";

  if (mode === "semantic" && kwTokens.length === 1) {
    // single-word fuzzy: allow small edit distance (handles minor typos /
    // close synonyms with shared roots, e.g. "analyse" vs "analyze")
    for (const rt of resumeTokens) {
      if (Math.abs(rt.length - kwTokens[0].length) <= 2) {
        if (levenshtein(rt, kwTokens[0]) <= 2) return "fuzzy";
      }
    }
  }

  return "absent";
}

export const ACTION_VERBS = [
  "led","built","designed","developed","implemented","launched","created",
  "managed","optimized","improved","increased","decreased","reduced",
  "automated","architected","deployed","engineered","spearheaded",
  "coordinated","analyzed","streamlined","delivered","scaled","drove",
  "established","mentored","negotiated","resolved","integrated","migrated",
];

// Detects quantifiable achievements: "20%", "$50k", "3x", "10 users", etc.
export const METRIC_REGEX = /(\d+(\.\d+)?\s?(%|x|k|K|M|million|billion|\$|users|customers|hours|days|weeks))/g;
