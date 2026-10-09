# CONTENT_TODO

Lista viva di asset mancanti, dati da verificare e decisioni aperte.
Regola: nessun dato inventato. Se manca, resta segnaposto e finisce qui.

## Da verificare (servono a te)

### Generali

- [x] Anni della laurea triennale: presi dal CV (Informatica, UNIMORE, 09/2022–07/2025) e aggiunti alla Traiettoria insieme allo stage in Max Mara (05–06/2021).
- [x] Lavoro in OT Consulting: descritto con le voci del CV (backend Python/REST per clienti enterprise, full-stack Vue.js + SQLAlchemy + MySQL, migrazione su Google Cloud; stage: sistema predittivo + LLM + FastAPI). Ho scelto di **non** nominare il cliente o l'app specifica.
- [ ] Frase hero: "I build systems that find what's similar — and measure whether they're right." / "Costruisco sistemi che trovano ciò che si somiglia, e misuro se hanno ragione."

### Dal CV

- [x] CV pubblicato in `public/cv/riccardo-bedogni-cv.pdf` (contiene solo email, città e link; metadati PDF vuoti).
- [x] Smart Parking segnato come "Progetto universitario"; Strumenti integrati con le competenze del CV (Java, C++, Flask, SQLAlchemy, MySQL, SQLite, LangChain, OpenAI API, Gemini, Google Cloud, Linux/Bash, Agile).
- [ ] **Incoerenza CV ↔ repo (Smart Parking)**: il CV dice "YOLOv11 computer vision for vehicle detection", ma il README del repo dice che YOLOv11 pre-addestrato trova 0 macchinine e che il default è la CV classica. Il sito segue il repo: conviene correggere il CV.
- [ ] Il CV elenca "RAG System for a Culinary Knowledge Base" (il repo Datapizza, escluso dal sito su tua richiesta). Va bene così?
- [ ] HR Case Study: dal CV non risulta se era individuale o di gruppo.

### Correzioni applicate

- [x] Il lavoro OMOP / schema matching è un **progetto universitario, non la tesi**. L'ho tolto dalla Traiettoria, la sezione "Tesi" è diventata "Ricerca" / "Research" e la pagina del progetto non parla più di tesi né di relatore. La sezione mantiene l'ancora `#thesis` per non rompere i link interni.
- [ ] Se più avanti vuoi aggiungere la tesi vera (argomento e relatore), basta un nuovo punto in `trajectory.steps` di `src/content/site/*.yaml`.

### Testi scritti da me da confermare (sezioni della home)

- [ ] **Metodo → "Come uso l'AI nel lavoro"**: i due paragrafi e i tre principi descrivono un uso quotidiano di Claude Code (pair programming, diff piccoli e riletti, verifica dei numeri sulla fonte). È una bozza plausibile ma riguarda le tue abitudini: correggila in `method.ai` di `src/content/site/*.yaml`.
- [ ] **Metodo → i 5 passi**: ognuno cita un esempio reale dai tuoi repo (AUC-PR, `'None'`, 114/586 unità, baseline debole, MOTA). Controlla che il tono ti rappresenti.
- [ ] **Contatti**: "Disponibile per parlare di ruoli in AI engineering e data/ML, collaborazioni di ricerca…". È corretto dire che sei aperto a nuovi ruoli? Se no, togli quella parte.
- [ ] **Traiettoria → intro**: "Ingegnere informatico di formazione, AI applicata di mestiere…".
- [ ] **Strumenti**: elenco ricavato dai repo (requirements, import, Makefile, report LaTeX) più Vue.js e Claude Code dal brief. Vuoi aggiungere altro, ad esempio Docker, cloud o SQL specifici?
- [ ] **Demo nella sezione Ricerca**: i nomi delle diagnosi nell'esempio giocattolo sono in inglese anche nella pagina italiana (termini medici). Dimmi se li vuoi tradotti.

### Per progetto

- [ ] **OMOP (progetto universitario)**: numeri finali di Recall@ground truth (esatto / semantico / ibrido × rumore 0,2–1,0). Oggi la pagina mostra il riquadro "Risultati da inserire".
- [ ] **OMOP**: il README cita `min_depth=4` come esempio, mentre l'esperimento principale (`phase3_universal.py`) usa `MIN_DEPTH = 2` e una soglia di 0,45. Nel testo ho descritto il filtro senza indicare il valore.
- [ ] **HR**: in `general_data.csv` **2.912 righe su 4.410 sono profili duplicati** (identici a parte l'EmployeeID; solo 1.498 profili distinti). Con lo split casuale 70/30 i duplicati finiscono sia in train sia in test, e questo spiega quasi certamente il 98–99% di Random Forest e XGBoost (la logistica fa 0,86). Sul sito **non** riporto quelle accuracy. Proposta: rifare la valutazione con deduplica o split per profilo, oppure presentare il progetto solo per feature engineering + SHAP (come ora).
- [ ] **HR**: il README dice "sei algoritmi", il notebook importa anche GaussianNB. È un progetto individuale o di un corso/gruppo? Il PDF `HR_CASE_STUDY_TRUE.pdf` fa pensare a una consegna d'esame.
- [ ] **Smart Parking**: contesto (esame, hackathon, progetto personale?) e se era un lavoro di gruppo. Il README cita `docs/` (ARCHITETTURA, DEMO, SCALETTA_VIDEO), che non sono nel repo.
- [ ] **Diabete**: il README indica sia "calibrazione di Platt" sia "regressione isotonica su validation". Sul sito ho scritto solo "probabilità calibrate". Quale delle due è corretta?
- [ ] **Diabete**: le figure del repo hanno testi in italiano. Sulla pagina inglese, rigenerarle in EN o lasciarle così?
- [ ] **Tactical**: licenza Pixabay delle clip, se vogliamo usare i frame annotati (oggi uso solo la heatmap, generata da te).
- [ ] **RAG**: il backend di generazione usa la Claude API o il CLI `claude` (lo dice il README). La UI Streamlit è pubblicabile come demo?

## Dedotto dal codice e non dal README (da rileggere)

- OMOP: la descrizione dei tre matcher (esatto / semantico / ibrido) viene da `phase3_matcher.py` e `phase3_universal.py`.
- HR: lo stack (scikit-learn, XGBoost, SHAP) e il setup di valutazione vengono dal notebook.
- Tutti gli altri testi vengono dai README e dai report dei repo, e tutti i numeri sono stati confrontati con i file sorgente.

## Asset da fornire

- [ ] CV in PDF (una lingua) → `public/cv/riccardo-bedogni-cv.pdf`.
- [ ] Screenshot della UI Streamlit del RAG (copertina del progetto principale).
- [ ] Screenshot della dashboard di Smart Parking Premium.
- [ ] (Opzionale) GIF o clip breve della pipeline Tactical Football con bounding box e squadre.
- [ ] Link alla demo del RAG Pipeline Visualizer quando sarà pubblica (campo `demo` in `src/content/projects/*/rag-visualizer.md`).

## README da migliorare (attività separata, opzionale)

- [ ] **HR_CASE_STUDY**: rifare la valutazione (vedi duplicati), aggiungere riproducibilità, togliere la dipendenza da Google Colab (`drive.mount`).
- [ ] **omop-taxonomic-schema-matching**: sezione Risultati con la tabella delle recall e un esempio concreto di errore di prossimità.
- [ ] **tactical_football**: portare nel README la tabella dei risultati del report (oggi sta solo in `reports/report_finale.md`).
- [ ] **smart-parking-premium**: aggiungere i `docs/` citati, oppure togliere il riferimento; aggiungere uno screenshot.

## Decisioni aperte

- [ ] Dominio personalizzato (per ora `*.pages.dev`; aggiornare `SITE` in `astro.config.mjs` e `public/robots.txt`).
- [x] Email: riccardobedogni03@gmail.com, mailto + copia, nessun form.
- [x] Niente foto; progetto Datapizza escluso.
- [x] Card grande: RAG AI Act. Card medie: Diabete, Tactical, OMOP. Compatte: Smart Parking, HR. "In arrivo": RAG Visualizer.
