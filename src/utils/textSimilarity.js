import { unescapeXml } from './xmlUtils';

/**
 * Normaliza título para comparação insensível a caixa, acentos, pontuação e espaços.
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return unescapeXml(title)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Normaliza DOI para comparação.
 */
export function normalizeDoi(doi) {
  if (!doi) return '';
  return unescapeXml(doi)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

/**
 * Normaliza um valor de enumeração contra um conjunto válido do DTD.
 */
export function normalizeEnum(val, validSet, fallback) {
  if (!val) return fallback;
  const upper = String(val)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  return validSet.has(upper) ? upper : fallback;
}

/**
 * Calcula similaridade entre dois títulos normalizados combinando:
 * - Coeficiente de Sørensen–Dice em bigramas de caracteres
 * - Jaccard em tokens relevantes (> 2 letras)
 * - Coincidência de subtítulo contido
 */
export function calculateTitleSimilarity(titleA, titleB) {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const minLen = Math.min(normA.length, normB.length);
  const maxLen = Math.max(normA.length, normB.length);
  let containmentBonus = 0;
  if (minLen >= 18 && (normA.includes(normB) || normB.includes(normA))) {
    containmentBonus = Math.max(0.78, minLen / maxLen);
  }

  const getBigrams = (s) => {
    const clean = s.replace(/\s+/g, ' ');
    const bigrams = new Map();
    for (let i = 0; i < clean.length - 1; i++) {
      const bg = clean.slice(i, i + 2);
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const bgA = getBigrams(normA);
  const bgB = getBigrams(normB);
  let intersectionBg = 0;
  let totalBgA = 0;
  let totalBgB = 0;
  for (const [, count] of bgA) totalBgA += count;
  for (const [, count] of bgB) totalBgB += count;
  for (const [bg, countA] of bgA) {
    if (bgB.has(bg)) {
      intersectionBg += Math.min(countA, bgB.get(bg));
    }
  }
  const diceScore =
    totalBgA + totalBgB > 0 ? (2 * intersectionBg) / (totalBgA + totalBgB) : 0;

  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 2));
  let tokenInter = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) tokenInter += 1;
  }
  const tokenUnion = tokensA.size + tokensB.size - tokenInter;
  const jaccardScore = tokenUnion > 0 ? tokenInter / tokenUnion : 0;

  const combined = diceScore * 0.6 + jaccardScore * 0.4;
  return Math.max(combined, containmentBonus);
}

