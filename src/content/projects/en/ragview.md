---
title: RAGView
pitch: Ask a question and watch a RAG system answer it. Chunking, embeddings, vector search and reranking run live in the browser, and every point and score on screen comes from a real pipeline trace.
tier: standard
order: 1.5
year: 2026
kind: RAG · Interactive visualisation
repo: https://github.com/bigbrisla/rag_view
demo: https://bigbrisla.github.io/rag_view/
stack: [Python, Vue 3, TypeScript, transformers.js, ONNX, UMAP, Pydantic, GSAP, Canvas 2D]
cover: ../../../assets/projects/ragview/screenshot-light.png
coverAlt: RAGView at the retrieval step. A question about Voyager 1 lands on a map of chunk embeddings, linked to its five nearest neighbours with cosine scores between 0.76 and 0.85; a side panel lists the selected chunks.
metrics:
  - { value: '0.70 → 0.85', label: 'Hit@1 with cross-encoder reranking (256-token chunks)' }
  - { value: '0.93', label: 'best MRR@10 (448-token chunks + rerank)' }
  - { value: '≈5e-7', label: 'browser vs Python embedding difference (same machine)' }
sources: [README.md, eval/questions.yaml]
---

<video src="/media/ragview-demo.mp4" poster="/media/ragview-poster.jpg" controls muted loop playsinline preload="metadata" width="1280" height="800" aria-label="Screen recording of RAGView playing a pipeline run step by step"></video>

## Problem

RAG is usually explained with a box diagram, and its failure modes stay abstract: chunks that are too small, an ambiguous question, a question the corpus can't answer. I wanted to make every step visible on real data, so you can _see_ why retrieval succeeds or fails. And I didn't want any of it faked.

## What I built

An interactive, animated walkthrough of a RAG pipeline over 47 Wikipedia articles on space exploration. You can play, pause, step and scrub through eight phases, change chunk size, overlap, top-k, the similarity threshold and reranking, and run guided failure cases (chunks too small, "Mercury": planet or NASA programme?, an out-of-corpus question, a case where reranking rescues retrieval).

- **Two engines, one trace.** An offline Python pipeline fetches pinned Wikipedia revisions, chunks with 13 presets, embeds with `bge-small-en-v1.5` and fits UMAP. A TypeScript engine mirrors it module by module and runs the **same ONNX model files** in a Web Worker through transformers.js. Both emit a typed trace defined with Pydantic and exported to JSON Schema, and the TypeScript types are generated from it.
- **Parity is tested.** Chunk boundaries match shared fixtures character for character, embeddings agree to about 5e-7 on the same machine, and the browser engine reproduces every recorded Python trace: same retrieved chunks, same prompt, same answer. Across CPU architectures the int8 kernels drift by up to about 0.015 in cosine, enough to swap near-tied chunks, so CI checks the same properties within that tolerance.
- **The player is a single clock.** Every view is a pure function of (trace, phase, progress), so pause, speed and stepping backwards are free. The map is a hand-written Canvas 2D renderer for thousands of points at 60 fps.
- **No vector database, on purpose.** A few thousand 384-dimensional vectors fit in a `Float32Array`. Brute-force cosine search takes well under a millisecond and gives _exact_ scores, which is what a visualiser should show.
- **UMAP offline, kNN placement online.** New points (queries, custom chunks) are placed with UMAP's own out-of-sample initialisation. A test checks it against `umap.transform` (median distance 0.06 on a map 2 units wide).
- **Generation is simulated, and says so.** No LLM is called, so the demo can stay public with no server, key or budget. Curated questions use scripted answers whose claims appear only if _all_ of their evidence reached the prompt: shrink the chunks and claims drop out. Free questions get an extractive answer with citations, or a refusal.

## Results

Retrieval measured on 47 hand-written questions, each paired with the article that answers it (`uv run ragview eval`):

| Chunking             | Rerank | Hit@1    | Hit@5 | MRR@10   |
| -------------------- | ------ | -------- | ----- | -------- |
| sentence, 48 tokens  | no     | 0.62     | 0.96  | 0.76     |
| sentence, 256 tokens | no     | 0.70     | 0.94  | 0.81     |
| sentence, 256 tokens | yes    | **0.85** | 0.96  | 0.90     |
| sentence, 448 tokens | yes    | **0.92** | 0.94  | **0.93** |
| fixed, 256 tokens    | yes    | 0.83     | 0.94  | 0.88     |

Reranking matters most for precision at the top. Document-level hits favour large chunks, though: they don't tell you whether the exact evidence fits in the prompt, and that is exactly what the failure cases in the app show.

## Limits

The answer step is simulated. The 2D map is a projection, while scores are always computed in 384 dimensions. The first live question downloads about 57 MB of models. Custom chunk settings re-embed the corpus on the device (about 40 s on a recent laptop). The corpus is English only and deliberately small.
