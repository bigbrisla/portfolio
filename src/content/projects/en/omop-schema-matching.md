---
title: Taxonomy-aware schema matching on OMOP-CDM
pitch: A university project on data integration. When clinical codes are slightly wrong, exact matching misses columns that clearly belong together. A similarity built on the SNOMED hierarchy recovers them.
tier: standard
order: 4
year: 2026
kind: Data integration · University project
stack: [Python, pandas, Valentine, OMOP-CDM, SNOMED, BigQuery]
repo: https://github.com/bigbrisla/omop-taxonomic-schema-matching
metrics: []
sources: [README.md, omop/README.md, omop/phase3_matcher.py, omop/phase3_universal.py]
needsReview: true
---

## Problem

Instance-based schema matchers decide that two columns correspond by looking at the values they share. In clinical data coded with OMOP-CDM, those values are `concept_id`s from vocabularies like SNOMED, and real coding errors are rarely random typos. They are **near misses** in the hierarchy: a sibling, parent or child of the right concept (_chronic kidney disease stage 4_ recorded as _stage 5_). Exact overlap treats a near miss like a completely different value, so columns that clearly belong together stop matching.

## What I built

On top of the [Valentine](https://github.com/delftdata/valentine) framework (its fabricator and the Recall@ground-truth metric):

- **A taxonomic noise operator** (`taxonomy_noise.py`) that perturbs concept columns by moving to a parent, child or sibling in the `CONCEPT_ANCESTOR` hierarchy. A `min_depth` filter skips concepts that are too generic, so the noise lands where real coding errors happen.
- **An OMOP fabricator** that reuses Valentine's vertical split and applies two kinds of noise: taxonomic on concept columns, lexical on free text. Each output is a source/target pair with ground truth, where joining on equality fails by construction.
- **A semantic similarity** derived from hierarchical distance (1 / (1 + distance)), built on _the same_ hierarchy as the noise.
- **Three matchers compared:** exact (classic Jaccard on values), semantic (values "overlap" when their similarity passes a threshold) and hybrid (semantic on concept columns, exact elsewhere).
- Data extracted from the public CMS synthetic OMOP dataset on BigQuery. Ancestors are fetched only for the values that actually appear in the fabricated pairs, so no full hierarchy dump is needed.

## Results

The experiment measures mean Recall@ground truth for exact, semantic and hybrid matching at four noise levels (0.2, 0.5, 0.8, 1.0) over five seeds each.

> **Results to be added.** The repository doesn't publish the final numbers yet. They will go here once confirmed.

## Context

A university project at the University of Modena and Reggio Emilia. The [research section](/#thesis) explains the idea without the jargon.
