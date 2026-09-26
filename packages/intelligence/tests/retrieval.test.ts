import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, rankByEmbedding } from "../src/retrieval";

describe("cosineSimilarity", () => {
  it("returns 1 for identical direction and 0 for orthogonal vectors", () => {
    assert.equal(cosineSimilarity([1, 0], [2, 0]), 1);
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  });

  it("returns -1 for opposite vectors", () => {
    assert.ok(Math.abs(cosineSimilarity([1, 1], [-1, -1]) - -1) < 1e-9);
  });

  it("degrades safely to 0 for empty, mismatched, zero, or non-finite input", () => {
    assert.equal(cosineSimilarity([], []), 0);
    assert.equal(cosineSimilarity([1, 2, 3], [1, 2]), 0);
    assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
    assert.equal(cosineSimilarity([Number.NaN, 1], [1, 1]), 0);
  });
});

describe("rankByEmbedding", () => {
  const candidates = [
    { id: "a", embedding: [1, 0, 0], metadata: { title: "A" } },
    { id: "b", embedding: [0.9, 0.1, 0], metadata: { title: "B" } },
    { id: "c", embedding: [0, 1, 0], metadata: { title: "C" } },
    { id: "d", embedding: [0, 0, 1], metadata: { title: "D" } },
  ];

  it("returns the closest matches highest-first, limited to topK", () => {
    const matches = rankByEmbedding({ queryEmbedding: [1, 0, 0], candidates, topK: 2 });
    assert.equal(matches.length, 2);
    assert.equal(matches[0].id, "a");
    assert.equal(matches[1].id, "b");
    assert.ok(matches[0].score >= matches[1].score);
    assert.equal(matches[0].metadata?.title, "A");
  });

  it("filters out candidates below minScore", () => {
    const matches = rankByEmbedding({
      queryEmbedding: [1, 0, 0],
      candidates,
      topK: 10,
      minScore: 0.5,
    });
    const ids = matches.map((m) => m.id);
    assert.deepEqual(ids, ["a", "b"]);
  });

  it("returns nothing for an empty query, empty candidates, or non-positive topK", () => {
    assert.deepEqual(rankByEmbedding({ queryEmbedding: [], candidates }), []);
    assert.deepEqual(rankByEmbedding({ queryEmbedding: [1, 0, 0], candidates: [] }), []);
    assert.deepEqual(rankByEmbedding({ queryEmbedding: [1, 0, 0], candidates, topK: 0 }), []);
  });

  it("breaks ties deterministically by id", () => {
    const tied = [
      { id: "z", embedding: [1, 0] },
      { id: "a", embedding: [1, 0] },
    ];
    const matches = rankByEmbedding({ queryEmbedding: [1, 0], candidates: tied, topK: 2 });
    assert.deepEqual(matches.map((m) => m.id), ["a", "z"]);
  });
});
