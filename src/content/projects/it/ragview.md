---
title: RAGView
pitch: Fai una domanda e guarda un sistema RAG rispondere. Chunking, embedding, ricerca vettoriale e reranking girano dal vivo nel browser, e ogni punto e punteggio sullo schermo viene da una traccia reale della pipeline.
tier: standard
order: 1.5
year: 2026
kind: RAG · Visualizzazione interattiva
repo: https://github.com/bigbrisla/rag_view
demo: https://bigbrisla.github.io/rag_view/
stack: [Python, Vue 3, TypeScript, transformers.js, ONNX, UMAP, Pydantic, GSAP, Canvas 2D]
cover: ../../../assets/projects/ragview/screenshot-light.png
coverAlt: RAGView al passo di retrieval. Una domanda su Voyager 1 cade su una mappa degli embedding dei chunk, collegata ai suoi cinque vicini più prossimi con similarità coseno tra 0,76 e 0,85; un pannello laterale elenca i chunk selezionati.
metrics:
  - { value: '0,70 → 0,85', label: 'Hit@1 con reranking cross-encoder (chunk da 256 token)' }
  - { value: '0,93', label: 'miglior MRR@10 (chunk da 448 token + rerank)' }
  - { value: '≈5e-7', label: 'differenza tra embedding nel browser e in Python (stessa macchina)' }
sources: [README.md, eval/questions.yaml]
---

<video src="/media/ragview-demo.mp4" poster="/media/ragview-poster.jpg" controls muted loop playsinline preload="metadata" width="1280" height="800" aria-label="Registrazione dello schermo di RAGView che esegue una pipeline passo per passo"></video>

## Il problema

Il RAG di solito si spiega con un diagramma a blocchi, e i suoi modi di fallire restano astratti: chunk troppo piccoli, una domanda ambigua, una domanda a cui il corpus non sa rispondere. Volevo rendere visibile ogni passaggio su dati veri, così da _vedere_ perché il retrieval funziona o sbaglia. E senza finzioni.

## Cosa ho costruito

Una visualizzazione animata e interattiva di una pipeline RAG su 47 articoli di Wikipedia sull'esplorazione spaziale. Si può avviare, mettere in pausa, avanzare e scorrere otto fasi, cambiare dimensione dei chunk, sovrapposizione, top-k, soglia di similarità e reranking, e provare casi di errore guidati (chunk troppo piccoli, "Mercury": pianeta o programma NASA?, una domanda fuori dal corpus, un caso in cui il reranking salva il retrieval).

- **Due motori, una traccia.** Una pipeline Python offline scarica revisioni fissate di Wikipedia, divide il testo in chunk con 13 preset, calcola gli embedding con `bge-small-en-v1.5` e addestra UMAP. Un motore TypeScript la rispecchia modulo per modulo ed esegue **gli stessi file ONNX** in un Web Worker tramite transformers.js. Entrambi producono una traccia tipizzata definita con Pydantic ed esportata in JSON Schema, da cui si generano i tipi TypeScript.
- **La parità è testata.** I confini dei chunk coincidono carattere per carattere con fixture condivise, gli embedding concordano a circa 5e-7 sulla stessa macchina e il motore nel browser riproduce ogni traccia registrata in Python: stessi chunk recuperati, stesso prompt, stessa risposta. Su architetture CPU diverse i kernel int8 si discostano fino a circa 0,015 di similarità coseno, abbastanza da scambiare chunk quasi alla pari, quindi la CI verifica le stesse proprietà entro quella tolleranza.
- **Il player è un unico orologio.** Ogni vista è una funzione pura di (traccia, fase, avanzamento), quindi pausa, velocità e passi indietro non costano nulla. La mappa è un renderer Canvas 2D scritto a mano per migliaia di punti a 60 fps.
- **Nessun database vettoriale, per scelta.** Qualche migliaio di vettori a 384 dimensioni sta in un `Float32Array`. La ricerca coseno esaustiva impiega molto meno di un millisecondo e dà punteggi _esatti_, che è ciò che un visualizzatore deve mostrare.
- **UMAP offline, posizionamento kNN online.** I nuovi punti (domande, chunk personalizzati) vengono posizionati con l'inizializzazione out-of-sample di UMAP stesso. Un test la confronta con `umap.transform` (distanza mediana 0,06 su una mappa larga 2 unità).
- **La generazione è simulata, e lo dichiara.** Nessun LLM viene chiamato, così la demo può restare pubblica senza server, chiavi o budget. Le domande curate usano risposte scritte a mano, le cui affermazioni compaiono solo se _tutte_ le loro prove sono arrivate nel prompt: rimpicciolendo i chunk, le affermazioni spariscono. Le domande libere ricevono una risposta estrattiva con citazioni, oppure un rifiuto.

## Risultati

Retrieval misurato su 47 domande scritte a mano, ognuna associata all'articolo che contiene la risposta (`uv run ragview eval`):

| Chunking             | Rerank | Hit@1    | Hit@5 | MRR@10   |
| -------------------- | ------ | -------- | ----- | -------- |
| per frasi, 48 token  | no     | 0,62     | 0,96  | 0,76     |
| per frasi, 256 token | no     | 0,70     | 0,94  | 0,81     |
| per frasi, 256 token | sì     | **0,85** | 0,96  | 0,90     |
| per frasi, 448 token | sì     | **0,92** | 0,94  | **0,93** |
| fisso, 256 token     | sì     | 0,83     | 0,94  | 0,88     |

Il reranking conta soprattutto per la precisione in cima alla lista. I risultati a livello di documento però favoriscono i chunk grandi: non dicono se la prova esatta sta nel prompt, ed è proprio ciò che mostrano i casi di errore nell'app.

## Limiti

La risposta finale è simulata. La mappa 2D è una proiezione, mentre i punteggi sono sempre calcolati in 384 dimensioni. La prima domanda libera scarica circa 57 MB di modelli. Le impostazioni di chunking personalizzate ricalcolano gli embedding dell'intero corpus sul dispositivo (circa 40 s su un portatile recente). Il corpus è solo in inglese e volutamente piccolo.
