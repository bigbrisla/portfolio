---
title: Smart Parking Premium
pitch: Il digital twin di un parcheggio. Una webcam sopra un plastico di carta aggiorna in tempo reale lo stato di ogni posto, e sopra ci sono un bot Telegram, una sbarra comandata dal GPS e una federazione B2B.
tier: compact
order: 5
year: 2026
kind: IoT · Computer vision · Progetto universitario
stack: [Python, FastAPI, OpenCV, YOLO, python-telegram-bot, pytest]
repo: https://github.com/bigbrisla/smart-parking-premium
metrics: []
sources: [README.md]
needsReview: true
---

## Il problema

Modellare un parcheggio (lo scenario è un centro commerciale vicino a Bologna più un parcheggio confinante) come **digital twin**: una copia virtuale dello stato fisico, posto per posto e in tempo reale, su cui si appoggiano tutte le altre funzioni. Il livello edge deve funzionare offline. Va in cloud solo ciò che ha bisogno di internet.

## Cosa ho costruito

- **Il cuore del twin:** stato in memoria thread-safe, con una macchina a tre stati (`FREE` / `OCCUPIED` / `RESERVED`) e regole di precedenza esplicite. Una prenotazione "protegge" il posto finché non arriva l'auto attesa.
- **Dalla visione al twin**, con un detector intercambiabile. Ho misurato che YOLOv11 pre-addestrato trova **zero** macchinine viste dall'alto, quindi il default è la computer vision classica, resa robusta alle ombre (soppressione in HSV) e alla mano che sposta le auto (rilevamento della pelle in YCrCb, rimozione dei blob sul bordo, debounce temporale).
- **GPS + Haversine** (implementata a mano): sotto una certa distanza si apre una sbarra simulata, eventualmente solo se c'è una prenotazione attiva.
- **Bot Telegram** per disponibilità, prenotazione, annullamento, posizione e targa.
- **Federazione B2B:** ogni parcheggio è un'istanza identica con la propria configurazione. Le istanze si scambiano solo la disponibilità aggregata, mai lo stato di dettaglio, e `/suggest` propone il parcheggio vicino quando uno è pieno.

## Risultati

Una demo funzionante dall'inizio alla fine, con test su Haversine, store e servizio. Il repo non pubblica una valutazione quantitativa.
