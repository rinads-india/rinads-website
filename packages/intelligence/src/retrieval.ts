/**
 * Pure vector-similarity retrieval helpers for RINPO business-data grounding.
 *
 * The production `match_business_data` path is planned to run as a pgvector
 * query inside Supabase (server-side, RLS-scoped). This module provides the
 * framework- and DB-agnostic ranking math that:
 * - powers unit tests for that ranking behavior;
 * - serves as an in-process reranker / fallback when pgvector is unavailable;
 * - keeps the scoring definition in one auditable place.
 *
 * It performs no I/O and calls no embedding provider — callers supply already
 * computed embeddings. It never fabricates matches: an empty candidate set (or
 * an all-below-threshold set) yields an empty result.
 */

export type EmbeddedRecord<Meta = Record<string, unknown>> = {
  id: string;
  embedding: number[];
  metadata?: Meta;
};

export type RankedMatch<Meta = Record<string, unknown>> = {
  id: string;
  score: number;
  metadata?: Meta;
};

export type RankOptions<Meta = Record<string, unknown>> = {
  queryEmbedding: number[];
  candidates: Array<EmbeddedRecord<Meta>>;
  /** Maximum matches to return. Defaults to 5. */
  topK?: number;
  /** Minimum cosine similarity (−1..1) to include. Defaults to 0. */
  minScore?: number;
};

/**
 * Cosine similarity of two equal-length vectors. Returns 0 for empty vectors,
 * length mismatches, or zero-magnitude vectors (undefined direction) rather
 * than NaN, so ranking degrades safely instead of throwing.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Rank candidates by cosine similarity to the query embedding, returning the
 * top-K matches at or above `minScore`, highest score first. Ties break by id
 * for deterministic output.
 */
export function rankByEmbedding<Meta = Record<string, unknown>>(
  options: RankOptions<Meta>,
): Array<RankedMatch<Meta>> {
  const { queryEmbedding, candidates } = options;
  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0;

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0 || topK <= 0) {
    return [];
  }

  const scored: Array<RankedMatch<Meta>> = [];
  for (const candidate of candidates) {
    const score = cosineSimilarity(queryEmbedding, candidate.embedding);
    if (score >= minScore) {
      scored.push({ id: candidate.id, score, metadata: candidate.metadata });
    }
  }

  scored.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));
  return scored.slice(0, topK);
}
