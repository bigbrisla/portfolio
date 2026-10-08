---
title: RAG verificabile sull'AI Act europeo
pitch: Un sistema di domande e risposte sull'AI Act, costruito su una norma cambiata dopo il cutoff del modello. Così il valore del retrieval si può contare, invece di darlo per scontato.
tier: featured
order: 1
year: 2026
kind: Retrieval-augmented generation · Valutazione
stack: [Python, ChromaDB, BM25, bge-base-en-v1.5, bge-reranker-base, Claude API, Streamlit]
repo: https://github.com/bigbrisla/rag_experiment
metrics:
  - { value: '0,750', label: 'recall@6 (baseline debole: 0,255)' }
  - { value: '0,873', label: 'nDCG@6' }
  - { value: '0', label: 'citazioni non valide' }
  - { value: '0,60 vs 0,20', label: 'fatti post-cutoff, con e senza RAG' }
sources: [README.md, reports/report.pdf, eval/results/latest.json]
---

## Il problema

Quasi tutte le demo RAG vengono provate su domande a cui il modello saprebbe già rispondere a memoria. In quel modo non si capisce cosa aggiunga davvero il retrieval. Ho scelto un dominio in cui la risposta è netta: il Regolamento (UE) 2024/1689, modificato dal Digital Omnibus sull'AI (Regolamento 2026/1744), pubblicato in Gazzetta Ufficiale il 24 luglio 2026, cioè dopo il cutoff del modello generatore. L'Omnibus ha spostato la scadenza per i sistemi ad alto rischio dell'Allegato III, ha aggiunto due divieti all'articolo 5 e ha riscritto l'articolo 4. Un modello che risponde a memoria su questi punti non è vago: sbaglia con sicurezza, e gli errori si possono contare.

## Cosa ho costruito

```
10 fonti ufficiali → 2.084 unità normative → 4.394 chunk
  → Chroma (bge-base-en-v1.5) + BM25
  → fusione RRF → espansione ai paragrafi fratelli → rerank cross-encoder
  → priorità alle fonti vincolanti → soglia di astensione
  → 6 passaggi → Claude (prompt vincolato alle fonti) → risposta con citazioni [S…]
```

Le scelte che hanno contato:

- **L'unità normativa come atomo.** Un chunk _è_ l'articolo 6(2): le citazioni sono esatte e la valutazione del retrieval ha una ground truth senza ambiguità. EUR-Lex usa due formati XHTML incompatibili, quindi il parser riconosce quale dei due ha davanti. Con il parser sbagliato il testo consolidato produceva in silenzio 114 unità invece di 586.
- **Cellar invece del sito di EUR-Lex**, che ai client non-browser risponde con una challenge anti-bot. L'endpoint dell'Ufficio delle pubblicazioni è la via ufficiale per l'accesso automatico.
- **Priorità alle fonti vincolanti.** Le linee guida della Commissione riformulano l'Atto con parole più semplici, e il reranker spesso le mette sopra l'articolo che spiegano. Un piccolo bonus al testo vincolante ha portato l'MRR da 0,50 a 0,64.
- **Espansione ai fratelli.** I paragrafi di un articolo sono un unico ragionamento: i fratelli entrano tra i candidati e decide comunque il reranker. Il numero di fratelli da aggiungere l'ho misurato invece di stimarlo: la recall è massima a 10.
- **Astensione calibrata.** Il reranker restituisce probabilità, non logit. Una soglia scelta a mano a −6,0 lasciava passare tutto e di fatto disattivava l'astensione. Ora la soglia è calibrata a 0,796 su domande di prova separate da quelle di valutazione.

## Risultati

40 domande su 7 tipi di errore. Le tabelle del report sono generate direttamente dai file di valutazione.

| Metrica                        | Sistema completo | Baseline debole | Senza RAG |
| ------------------------------ | ---------------- | --------------- | --------- |
| recall@6                       | **0,750**        | 0,255           | —         |
| MRR                            | **0,662**        | 0,173           | —         |
| nDCG@6                         | **0,873**        | 0,262           | —         |
| Fatti chiave (32 dom.)         | **0,922**        | 0,906           | 0,859     |
| Fatti post-cutoff (5 dom.)     | **0,60**         | 0,60            | 0,20      |
| Fedeltà alle fonti (giudicata) | 0,955            | —               | —         |
| Citazioni non valide           | **0**            | 0               | —         |

Due risultati da leggere con attenzione. Il primo: qualità del retrieval e accuratezza finale non vanno di pari passo. Il sistema completo recupera circa tre volte meglio, ma sui fatti chiave guadagna poco, perché il generatore spesso ricava il fatto giusto da passaggi mediocri o dalla memoria. È un buon motivo per valutare il retrieval a parte. Il secondo: sulle domande post-cutoff il discorso si chiude, perché il retrieval triplica i fatti recuperati.

## Limiti

- Il set di valutazione è piccolo (40 domande) e l'ho scritto io: nessuna metrica, da sola, va presa per oro colato.
- I testi consolidati hanno valore redazionale. Ciò che conta dal punto di vista legale va verificato sulla Gazzetta Ufficiale.
- Solo in inglese e non è consulenza legale: il sistema riporta cosa dicono le norme, non valuta situazioni concrete.
