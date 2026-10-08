---
title: Grounded RAG on the EU AI Act
pitch: A question-answering system over the AI Act, built on a law that changed after the model's knowledge cutoff, so the value of retrieval can be counted instead of assumed.
tier: featured
order: 1
year: 2026
kind: Retrieval-augmented generation · Evaluation
stack: [Python, ChromaDB, BM25, bge-base-en-v1.5, bge-reranker-base, Claude API, Streamlit]
repo: https://github.com/bigbrisla/rag_experiment
metrics:
  - { value: '0.750', label: 'recall@6 (weak baseline: 0.255)' }
  - { value: '0.873', label: 'nDCG@6' }
  - { value: '0', label: 'invalid citations' }
  - { value: '0.60 vs 0.20', label: 'post-cutoff facts, RAG vs no RAG' }
sources: [README.md, reports/report.pdf, eval/results/latest.json]
---

## Problem

Most RAG demos are tested on questions the model could already answer from memory, which makes it impossible to tell what retrieval is actually contributing. I picked a domain where that question has a clean answer: Regulation (EU) 2024/1689, as amended by the Digital Omnibus on AI (Regulation 2026/1744), published in the Official Journal on 24 July 2026. That date falls after the generator's knowledge cutoff. The Omnibus moved the Annex III high-risk deadline, added two prohibitions to Article 5 and rewrote Article 4. A model answering from memory isn't vague about any of this. It is confidently wrong, and I can count how often.

## What I built

```
10 official sources → 2,084 legal units → 4,394 chunks
  → Chroma (bge-base-en-v1.5) + BM25
  → RRF fusion → sibling expansion → cross-encoder rerank
  → normative-authority prior → abstention gate
  → 6 passages → Claude (grounded prompt) → answer with [S…] citations
```

The decisions that mattered:

- **The legal unit is the atom.** A chunk _is_ Article 6(2), so citations are exact and retrieval evaluation gets unambiguous ground truth. EUR-Lex serves two incompatible XHTML formats, so the parser sniffs which one it has. Parsing the consolidated text with the wrong parser silently produced 114 units instead of 586.
- **Cellar instead of the EUR-Lex front-end**, which sends non-browser clients a bot challenge. The Publications Office endpoint is the sanctioned machine-readable route.
- **Normative-authority prior.** Commission guidelines restate the Act in plainer words, so the reranker often scores them above the provision they explain. Giving binding text a mild bonus raised MRR from 0.50 to 0.64.
- **Sibling expansion.** The paragraphs of an article form a single argument, so siblings are added to the candidate pool and the reranker still decides. I swept the budget instead of guessing it: recall peaks at 10.
- **Calibrated abstention.** The reranker outputs probabilities, not logits, so a hand-picked threshold of −6.0 passed every score and quietly switched abstention off. The threshold is now calibrated to 0.796 on probe sets kept disjoint from the evaluation questions.

## Results

40 questions across 7 failure modes. The report's tables are generated straight from the evaluation output files.

|                         | Full system | Weak baseline | No RAG |
| ----------------------- | ----------- | ------------- | ------ |
| recall@6                | **0.750**   | 0.255         | —      |
| MRR                     | **0.662**   | 0.173         | —      |
| nDCG@6                  | **0.873**   | 0.262         | —      |
| Key facts (32 q)        | **0.922**   | 0.906         | 0.859  |
| Post-cutoff facts (5 q) | **0.60**    | 0.60          | 0.20   |
| Faithfulness (judged)   | 0.955       | —             | —      |
| Invalid citations       | **0**       | 0             | —      |

Two things I'd read carefully. First, retrieval quality and end-to-end accuracy come apart: the full system retrieves about three times better, but scores only slightly higher on key facts, because the generator can often recover the fact from mediocre passages or from memory. That argues for scoring retrieval separately. Second, the post-cutoff subset is where the argument is settled: retrieval triples the recovered facts.

## Limits

- The evaluation set is small (40 questions) and I wrote it myself, so no single metric should be over-trusted.
- Consolidated texts are editorial. Anything that matters legally has to be checked against the Official Journal.
- English only, and not legal advice: the system reports what provisions say, it doesn't assess situations.
