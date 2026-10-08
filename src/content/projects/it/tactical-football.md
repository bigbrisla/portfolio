---
title: Tactical Football
pitch: Una pipeline di computer vision per il calcio, dalla detection al tracking, dall'assegnazione delle squadre alla calibrazione del campo fino alla vista dall'alto, con ogni fase misurata su una ground truth annotata a mano.
tier: standard
order: 3
year: 2026
kind: Computer vision
stack: [Python, YOLOv8, ByteTrack, supervision, OpenCV, scikit-learn, motmetrics, Streamlit]
repo: https://github.com/bigbrisla/tactical_football
cover: ../../../assets/projects/tactical-football/heatmap.png
coverAlt: Heatmap di occupazione vista dall'alto attorno al cerchio di centrocampo, costruita da posizioni annotate a mano su tre frame di una clip aerea.
metrics:
  - { value: '0,914', label: 'accuracy assegnazione squadra (32/35)' }
  - { value: '~30 FPS', label: 'su Apple M4 (clip sorgente: 25 FPS)' }
  - { value: '0,17–1,05 m', label: "errore dell'omografia sui frame di validazione" }
sources: [reports/report_finale.md, eval/results_*.json]
---

## Il problema

Non un singolo compito isolato, ma una **pipeline tattica completa** in cui ogni fase si misura per conto suo: mAP per la detection, MOTA/IDF1 per il tracking, accuracy per l'assegnazione delle squadre, errore di riproiezione in metri per l'omografia. Volevo evitare di fermarmi al "sembra che funzioni". Il tutto dentro vincoli realistici: un solo sviluppatore, un portatile (Apple M4, PyTorch/MPS), clip royalty-free e niente accesso a SoccerNet.

## Cosa ho costruito

```
Detection (YOLOv8n) → Tracking (ByteTrack) → Squadra (KMeans su H,S del busto)
  → Omografia (RANSAC, coordinate FIFA) → vista dall'alto, heatmap, distanza
```

- Detector COCO pre-addestrato messo a confronto con un **fine-tuning su pseudo-label**, provato su due clip.
- ByteTrack tramite `supervision`, che gestisce occlusioni brevi e tracce perse invece di un abbinamento ingenuo frame per frame.
- Assegnazione delle squadre non supervisionata, con filtri che escludono i pixel d'erba e quelli scuri.
- Omografia validata su frame diversi da quello usato per stimarla.
- Ground truth manuale per ogni componente (precisione dichiarata ±15–20 px), benchmark degli FPS e una dashboard Streamlit per esplorare nuove clip.

## Risultati

| Fase                       | Risultato                                                                        |
| -------------------------- | -------------------------------------------------------------------------------- |
| Assegnazione squadra       | accuracy **0,914** (32/35), il numero migliore della pipeline                    |
| Detection, clip principale | AP@0,5 persone da 0,353 a **0,408** dopo il fine-tuning; palla 0,000             |
| Detection, seconda clip    | persone **0,747** e palla **1,000** con il _baseline_; dopo il fine-tuning 0,521 |
| Tracking                   | MOTA −0,30, IDF1 0,43, un solo cambio di identità su 40 istanze                  |
| Omografia                  | errore medio di 0,165 m e 1,045 m sui due frame di validazione                   |
| Velocità                   | ~30–33 FPS su M4/MPS, sopra i 25 FPS della clip                                  |

Il risultato più istruttivo: **il fine-tuning ha peggiorato la generalizzazione.** Sulla clip principale aiuta, ma su una clip con luce e inquadratura diverse scende da 0,747 a 0,521. È overfitting al dominio, e lo riporto invece di nasconderlo dietro un generico "il fine-tuning funziona". Anche il MOTA negativo va letto nel suo contesto: gran parte dei "falsi positivi" sono persone reali escluse dalla ground truth per scelta, e la frammentazione delle tracce nasce dalla recall limitata del detector a monte, non dal tracker.

## Limiti

Il detector generico non trova nessun giocatore nella ripresa aerea verticale, quindi le analisi dall'alto usano **posizioni annotate a mano**, e il codice lo dichiara esplicitamente. Le riprese sono amatoriali e da drone, non televisive. L'omografia è calibrata solo attorno al cerchio di centrocampo. La palla si perde nelle riprese a bassa risoluzione e mosse.
