---
title: 30-day readmission in diabetic patients
pitch: An end-to-end clinical ML pipeline, plus an experiment asking whether the validation protocol matters as much as the model. It doesn't, and the negative result is the most useful thing the project produced.
tier: standard
order: 2
year: 2026
kind: Machine learning · Methodology
stack: [Python, scikit-learn, pandas, SHAP, FastAPI, pytest]
repo: https://github.com/bigbrisla/diabetes_prediction
cover: ../../../assets/projects/diabetes-readmission/protocol_01_comparison.png
coverAlt: Paired comparison of protocol errors on AUC-PR with 95% confidence intervals. Only one effect is resolved (−8.2%), and none reaches the +4.7% gained by changing model.
metrics:
  - { value: '0.230', label: 'AUC-PR on test (prevalence 0.114, lift 2.02×)' }
  - { value: '24.3%', label: 'readmissions caught in the top-10% risk group' }
  - { value: '−8.2%', label: 'the only resolved protocol effect' }
sources: [README.md, reports/metrics.json, reports/protocol_experiment.md]
---

## Problem

Predict which hospital stays of diabetic patients will end in a **readmission within 30 days**, to decide who gets enrolled in a capacity-limited transitional-care programme. The data is Diabetes 130-US Hospitals (UCI #296, CC BY 4.0): 101,766 stays, 71,518 patients, up to 40 stays per patient, about 11% positives.

I chose it over two other medical datasets because it is full of real problems: repeated patients that force a group-aware split, missing values that aren't random, ICD-9 categoricals with 700+ levels, and a target definition that has a flaw you have to find yourself.

## What I built

- **Two data problems, found and fixed.** 2,752 stays end in death or hospice, so those patients _cannot_ be readmitted. Keeping them teaches the model to recognise mortality and passes it off as predictive power. Separately, in two lab columns the string `'None'` means "test not ordered", which is a clinical decision and therefore a signal. pandas turns it into `NaN` by default. Only `'?'` is truly missing.
- **Group-aware split** (`StratifiedGroupKFold` on patient, 64/16/20), with an `assert_disjoint` guardrail that raises if a patient lands in two partitions.
- **Every fitted step inside the Pipeline.** No `dropna()`: missingness gets an explicit category plus a `*_recorded` flag.
- **Metrics chosen for the decision.** AUC-PR rather than accuracy, a decision threshold set by expected cost (assumed 10:1, with a sensitivity analysis from 1:1 to 50:1), and calibrated probabilities, because the ward needs to know _how many_ patients to enrol.
- **The protocol experiment.** Comparing two protocols directly was the wrong design: they produce different test sets, and sampling noise (about 5 points of standard deviation) drowns a 2% effect. The final design is **paired**, and it adds a data-volume control arm for patient leakage.
- FastAPI service, a test suite (data, leakage, evaluation, model contract, API) and a Makefile that encodes the phases as a small DAG.

## Results

Final model: HistGradientBoosting, evaluated once on the test set (19,867 stays from 13,951 patients never seen in training).

| Metric  | Value                                                                        |
| ------- | ---------------------------------------------------------------------------- |
| AUC-PR  | **0.230** (95% CI 0.217–0.245), prevalence 0.114 → lift 2.02×                |
| AUC-ROC | 0.671 (95% CI 0.659–0.683); the literature on this dataset reports 0.65–0.70 |
| Brier   | 0.096                                                                        |

![Precision–recall and ROC curves for logistic regression, random forest and gradient boosting on the test set. The three models almost overlap; the PR curve sits just above the 0.114 prevalence line at high recall. Figure labels in Italian, from the repository.](../../../assets/projects/diabetes-readmission/model_01_curves.png)

Following the 10% of patients with the highest risk catches **24.3% of readmissions**, against 10% at random. Four out of five still go unflagged. Model families barely differ: about 10 thousandths of AUC-PR separate logistic regression from boosting in cross-validation.

**The hypothesis was rejected.** Patient leakage (net of data volume): −0.5% [−1.6, +0.6]. Preprocessing fitted before the split: +0.0% [−1.4, +1.4]. Evaluating on patients whose outcome was impossible: **−8.2%** [−10.1, −6.3], the only resolved effect, and in the opposite direction from what I expected. None of them comes close to the +4.7% gained by switching from logistic regression to boosting.

## Limits

The signal is weak by nature: no variable separates the classes (|Cohen's d| < 0.4). The model mostly identifies heavy users of the health system rather than the sickest patients. The cohort is 75% Caucasian, so confidence intervals on small groups are too wide to conclude anything about fairness. The data is US-only, 1999–2008, ICD-9. It is a prioritisation tool, not a medical device.
