---
title: HR attrition analytics
pitch: Why do employees leave? Feature engineering on badge logs, six classifiers compared, and SHAP to turn the model into actions for HR.
tier: compact
order: 6
year: 2026
kind: Machine learning · Explainability
stack: [Python, scikit-learn, XGBoost, SHAP, pandas, Jupyter]
repo: https://github.com/bigbrisla/HR_CASE_STUDY
metrics: []
sources: [README.md, HR_CASE_STUDY.ipynb]
needsReview: true
---

## Problem

A company of about 4,000 employees loses 15% of them every year. The goal is to model the probability of leaving and find the factors HR can act on first.

## What I built

- One dataset joined from five sources: personal data, an employee survey, a manager survey and badge in/out logs.
- **Behavioural features built from the raw time logs:** average daily hours (`HoursPerDay`), the longest run of consecutive absences (`LongestAbsence`) and how often a shift starts or ends at unusual times (`WorkOffHours`).
- Six classifiers compared (logistic regression, SVM, KNN, decision tree, random forest, XGBoost), with attention to precision, recall and F1 because the classes are imbalanced.
- **SHAP** to open up the black box. Longer working hours raise the risk sharply, and so do a younger age, less experience and a short relationship with the current manager. Long absences turned out to be marginal.

## Results

The SHAP findings above are the main output. Tree-based models scored highest in the notebook, but I am not quoting their accuracy here until the validation has been re-checked.
