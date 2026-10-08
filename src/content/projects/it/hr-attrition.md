---
title: HR analytics sul turnover
pitch: Perché i dipendenti se ne vanno? Feature engineering sui log dei badge, sei classificatori a confronto e SHAP per trasformare il modello in azioni per l'HR.
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

## Il problema

Un'azienda di circa 4.000 dipendenti ne perde il 15% ogni anno. L'obiettivo è stimare la probabilità di abbandono e capire su quali fattori l'HR può intervenire per primi.

## Cosa ho costruito

- Un unico dataset ricavato da cinque fonti: anagrafica, survey dei dipendenti, survey dei manager e log di entrata e uscita.
- **Feature comportamentali ricavate dai log orari grezzi:** ore medie al giorno (`HoursPerDay`), la serie più lunga di assenze consecutive (`LongestAbsence`) e la frequenza di turni iniziati o finiti in orari insoliti (`WorkOffHours`).
- Sei classificatori a confronto (regressione logistica, SVM, KNN, albero decisionale, random forest, XGBoost), guardando precision, recall e F1 perché le classi sono sbilanciate.
- **SHAP** per aprire la scatola nera. Più ore lavorate fanno salire nettamente il rischio, e lo stesso vale per età più giovane, meno esperienza e un rapporto breve con il manager attuale. Le assenze lunghe sono risultate marginali.

## Risultati

Il risultato principale sono le evidenze SHAP descritte sopra. Nel notebook i modelli ad albero ottengono i punteggi più alti, ma non riporto qui la loro accuracy finché la validazione non sarà ricontrollata.
