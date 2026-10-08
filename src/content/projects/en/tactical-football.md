---
title: Tactical Football
pitch: A computer-vision pipeline for football, from detection and tracking to team assignment, pitch calibration and a bird's-eye view, with each stage measured against hand-made ground truth.
tier: standard
order: 3
year: 2026
kind: Computer vision
stack: [Python, YOLOv8, ByteTrack, supervision, OpenCV, scikit-learn, motmetrics, Streamlit]
repo: https://github.com/bigbrisla/tactical_football
cover: ../../../assets/projects/tactical-football/heatmap.png
coverAlt: Occupancy heatmap on a bird's-eye view of the pitch around the centre circle, built from manually annotated positions on three frames of an aerial clip.
metrics:
  - { value: '0.914', label: 'team assignment accuracy (32/35)' }
  - { value: '~30 FPS', label: 'on an Apple M4 (source clip: 25 FPS)' }
  - { value: '0.17–1.05 m', label: 'homography error on validation frames' }
sources: [reports/report_finale.md, eval/results_*.json]
---

## Problem

Not one isolated task but an **integrated tactical pipeline**, where every stage can be measured on its own: mAP for detection, MOTA/IDF1 for tracking, accuracy for team assignment, reprojection error in metres for the homography. I wanted to avoid stopping at "it looks like it works". I also had to fit realistic constraints: a single developer, a laptop (Apple M4, PyTorch/MPS), royalty-free footage and no access to SoccerNet.

## What I built

```
Detection (YOLOv8n) → Tracking (ByteTrack) → Team (KMeans on torso H,S)
  → Homography (RANSAC, FIFA pitch coordinates) → bird's-eye view, heatmap, distance
```

- Pretrained COCO detector compared against a **pseudo-label fine-tune**, tested on two clips.
- ByteTrack through `supervision`, which handles short occlusions and lost tracks instead of naive frame-to-frame matching.
- Unsupervised team assignment, with filters that ignore grass and dark pixels.
- Homography validated on frames other than the one it was fitted on.
- Manual ground truth for every component (declared precision ±15–20 px), an FPS benchmark and a Streamlit dashboard to explore new clips.

## Results

| Stage                  | Result                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| Team assignment        | **0.914** accuracy (32/35), the strongest number in the pipeline        |
| Detection, main clip   | person AP@0.5 0.353 → **0.408** after fine-tuning; ball 0.000           |
| Detection, second clip | person **0.747**, ball **1.000** with the _baseline_; fine-tuned: 0.521 |
| Tracking               | MOTA −0.30, IDF1 0.43, a single ID switch across 40 instances           |
| Homography             | 0.165 m and 1.045 m mean error on the two validation frames             |
| Throughput             | ~30–33 FPS on M4/MPS, above the clip's 25 FPS                           |

The most instructive finding: **fine-tuning made generalisation worse.** It helped on the main clip and dropped from 0.747 to 0.521 on a clip with different light and camera angle. That is domain overfitting, and I report it rather than hiding it behind "fine-tuning helps". The negative MOTA needs context too: most of the "false positives" are real people excluded from the ground truth by policy, and fragmentation comes from the detector's limited recall upstream, not from the tracker.

## Limits

The generic detector finds no players in the nadir aerial view, so the bird's-eye analytics use **manually annotated positions**, and the code says so explicitly. The footage is amateur and drone stock, not TV broadcast. The homography is only calibrated around the centre circle. The ball is lost on low-resolution, blurred footage.
