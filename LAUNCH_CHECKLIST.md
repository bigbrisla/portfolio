# Checklist di lancio

## Prima di pubblicare

- [ ] Rileggi testi e numeri: `src/content/site/*.yaml` e `src/content/projects/*/*.md`.
- [ ] Chiudi i punti bloccanti di [`CONTENT_TODO.md`](CONTENT_TODO.md), in particolare:
  - [ ] la sezione "Come uso l'AI" (Metodo) descrive davvero il tuo modo di lavorare?
  - [ ] la frase "Disponibile per parlare di ruoli…" (Contatti) va bene?
  - [ ] risultati del progetto OMOP, oppure lascia il riquadro "Risultati da inserire"
- [ ] Aggiungi il CV: `public/cv/riccardo-bedogni-cv.pdf` (il pulsante compare da solo).
- [ ] Copertine mancanti: screenshot Streamlit (RAG), dashboard Smart Parking.
- [ ] `npm run lint && npm run check && npm run build` senza errori.
- [ ] `npm run preview` e prova su telefono vero, nella stessa rete: `npx astro preview --host`.

## Pubblicazione

- [x] Repo GitHub `bigbrisla/portfolio` creato e pubblicato.
- [x] Sito online su https://riccardo-bedogni.pages.dev (aggiornamenti: `npm run deploy`).
- [ ] (Opzionale) deploy automatico a ogni push: due secret su GitHub, vedi README → Deploy.
- [x] `SITE` già impostato su `riccardo-bedogni.pages.dev`.
- [ ] (Opzionale) dominio personalizzato → README → Custom domain.

## Dopo il deploy

- [ ] [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/): incolla l'URL e controlla l'anteprima (immagine OG 1200×630).
- [ ] [Rich Results Test](https://search.google.com/test/rich-results): verifica il JSON-LD `Person` sulla home.
- [ ] Google Search Console: aggiungi la proprietà e invia `sitemap-index.xml`.
- [ ] Lighthouse sull'URL pubblico (mobile): obiettivo ≥ 95 in tutte e quattro le categorie.

## LinkedIn

- [ ] Sezione **Contatti → Sito web**: aggiungi l'URL ("Portfolio").
- [ ] **In primo piano**: aggiungi il link al portfolio e quello al caso RAG (`/projects/rag-ai-act`); l'anteprima usa le immagini OG dedicate.
- [ ] Headline coerente con il sito, ad esempio: _AI Engineer · Data & ML @ OT Consulting | MSc Computer Engineering @ UNIMORE_.
- [ ] Post di lancio breve: un problema reale (il RAG su norme cambiate dopo il cutoff), un numero, il link.

## GitHub

- [ ] Imposta **Website** nel profilo con l'URL del portfolio.
- [ ] Fissa (pin) i repo nell'ordine del sito: `rag_experiment`, `diabetes_prediction`, `tactical_football`, `omop-taxonomic-schema-matching`.
- [ ] Aggiungi una descrizione di una riga e i topic ai repo che non li hanno (`rag_experiment`, `tactical_football`, `omop-taxonomic-schema-matching`, `smart-parking-premium`).
- [ ] (Opzionale) README del profilo (`bigbrisla/bigbrisla`) con 3 righe e il link al sito.
- [ ] Valuta i miglioramenti ai README elencati in `CONTENT_TODO.md`.
