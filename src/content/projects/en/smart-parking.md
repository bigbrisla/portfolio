---
title: Smart Parking Premium
pitch: A parking digital twin. A webcam over a paper mock-up updates each slot's state in real time, and a Telegram bot, GPS-based barrier logic and B2B federation are built on top.
tier: compact
order: 5
year: 2026
kind: IoT · Computer vision · University project
stack: [Python, FastAPI, OpenCV, YOLO, python-telegram-bot, pytest]
repo: https://github.com/bigbrisla/smart-parking-premium
metrics: []
sources: [README.md]
needsReview: true
---

## Problem

Model a parking lot (the scenario is a shopping mall near Bologna plus a neighbouring car park) as a **digital twin**: a live, slot-by-slot virtual copy of the physical state that every other feature relies on. The edge layer has to work offline. Only the services that need the internet go to the cloud.

## What I built

- **The twin core:** thread-safe, in-memory state with a three-state machine (`FREE` / `OCCUPIED` / `RESERVED`) and explicit precedence rules. A reservation protects a slot until the expected car arrives.
- **Vision → twin**, with a pluggable detector. I measured that pretrained YOLOv11 finds **zero** of the top-down toy cars, so the default is classic computer vision, hardened against shadows (HSV suppression) and against the hand that moves the cars (YCrCb skin detection, border-blob removal, temporal debounce).
- **GPS + Haversine** (implemented by hand) opens a simulated barrier below a distance threshold, optionally only with an active reservation.
- **Telegram bot** for availability, booking, cancellation, position and plate.
- **B2B federation:** every car park runs as an identical instance with its own config. Instances exchange only aggregate availability, never detailed state, and `/suggest` proposes the neighbour when one is full.

## Results

A working end-to-end demo with tests for Haversine, the store and the service. No quantitative evaluation is published in the repo.
