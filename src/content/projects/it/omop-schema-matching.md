---
title: Schema matching tassonomico su OMOP-CDM
pitch: Il codice della mia tesi. Quando i codici clinici sono "quasi giusti", il confronto esatto perde colonne che stanno chiaramente insieme. Una similarità costruita sulla gerarchia SNOMED le ritrova.
tier: standard
order: 4
year: 2026
kind: Data integration · Ricerca di tesi
stack: [Python, pandas, Valentine, OMOP-CDM, SNOMED, BigQuery]
repo: https://github.com/bigbrisla/omop-taxonomic-schema-matching
metrics: []
sources: [README.md, omop/README.md, omop/phase3_matcher.py, omop/phase3_universal.py]
needsReview: true
---

## Il problema

Gli schema matcher instance-based decidono che due colonne corrispondono guardando i valori che hanno in comune. Nei dati clinici codificati con OMOP-CDM quei valori sono `concept_id` di vocabolari come SNOMED, e i veri errori di codifica raramente sono refusi casuali. Sono **errori di prossimità** nella gerarchia: un fratello, un padre o un figlio del concetto giusto (_insufficienza renale cronica stadio 4_ registrata come _stadio 5_). Il confronto esatto tratta un errore di prossimità come un valore del tutto diverso, e così colonne che stanno chiaramente insieme smettono di corrispondere.

## Cosa ho costruito

Sopra il framework [Valentine](https://github.com/delftdata/valentine) (il suo fabricator e la metrica Recall@ground truth):

- **Un operatore di rumore tassonomico** (`taxonomy_noise.py`) che perturba le colonne-concetto spostandosi su padre, figlio o fratello nella gerarchia `CONCEPT_ANCESTOR`. Un filtro `min_depth` salta i concetti troppo generici, così il rumore cade dove avvengono davvero gli errori di codifica.
- **Un fabricator OMOP** che riusa lo split verticale di Valentine e applica due tipi di rumore: tassonomico sulle colonne-concetto, lessicale sul testo libero. Ogni output è una coppia sorgente/destinazione con la sua ground truth, in cui il join per uguaglianza fallisce per costruzione.
- **Una similarità semantica** ricavata dalla distanza nella gerarchia (1 / (1 + distanza)), costruita sulla _stessa_ gerarchia del rumore.
- **Tre matcher a confronto:** esatto (Jaccard classico sui valori), semantico (due valori "si sovrappongono" se la loro similarità supera una soglia) e ibrido (semantico sulle colonne-concetto, esatto sulle altre).
- Dati estratti dal dataset pubblico CMS synthetic OMOP su BigQuery. Gli antenati vengono scaricati solo per i valori che compaiono davvero nelle coppie generate, quindi non serve un dump completo della gerarchia.

## Risultati

L'esperimento misura la Recall@ground truth media dei matcher esatto, semantico e ibrido a quattro livelli di rumore (0,2, 0,5, 0,8, 1,0), con cinque seed per livello.

> **Risultati da inserire.** Il repository non pubblica ancora i numeri finali. Li aggiungo qui appena confermati.

## Contesto

È il nucleo di ricerca della mia tesi magistrale all'Università di Modena e Reggio Emilia, con relatore il Prof. Beneventano. La [sezione Tesi](/it/#thesis) spiega l'idea senza gergo tecnico.
