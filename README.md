# Hanzi Pocket — Gallery & Collections preview

Live trial: https://ckeyp8.github.io/hanzi-pocket-preview/

A separate, interactive preview of the proposed STEM and collection features for Hanzi Pocket. It includes the full 3,600-entry HSK 1–5 catalog and all vocabulary rows from the official CSCA STEM Chinese and foundation Chinese lists, checked on 9 November 2026. The syllabus linked by the official preparation page is the 2025 edition; the vocabulary PDFs have no separate edition date.

STEM has 950 source entries (300 beginner, 300 intermediate, 350 advanced), represented by 948 distinct character/pronunciation cards. Foundation has 5,164 source entries (2,093 beginner, 1,976 intermediate, 1,095 advanced), represented by 5,062 distinct cards. Duplicate spelling/pronunciation rows share one card while retaining all source references. Browse the complete list or practise one official level. Source coverage, SHA-256 hashes and editorial notes are in `CSCA-SOURCES.txt`; each word also links to its source PDF. English meanings are independently added from CC-CEDICT and technical glosses. The PDFs' separate grammar and expression lessons are outside these vocabulary decks. This is vocabulary practice rather than a complete CSCA mock exam.

The character library uses photo-like square tiles. Create your own collections, combine HSK, STEM and personal entries, and keep a word in several collections. Open a word to save it and choose collections, select several gallery tiles to organise them together, or add your own Chinese word with pinyin and meaning. The Groups panel shows album covers and category-only practice.

Flashcards and reversed dictation work with all sources and custom collections. Each pass consumes its cards once, with missed words revisited on a later pass. Full Pocket practice continues into the last HSK level when the Pocket pass finishes; custom-collection practice stays within that collection. Undo also works across the Pocket-to-HSK transition. There is no daily review cap.

The daily-use app remains at https://ckeyp8.github.io/hanzi-pocket-web/ . This preview uses its own browser-storage key, `hanzi-pocket-preview-state-v2`, and does not open the main app's vocabulary database. It reads older preview-only saves and maps the ten former HSK sample IDs and 26 former STEM IDs into the full catalogs while preserving saved terms, custom collections and learning records. Six formerly saved terms outside the official STEM list remain in Pocket and are excluded from official decks. The old key is retained for rollback. Test progress stays in the current browser and does not synchronize across devices. Use Backup in My Pocket to download a preview JSON snapshot.

Open the preview in Safari on an iPhone. Select STEM Chinese or CSCA foundation, choose a level or browse all words, choose Flashcards or Dictation, then start. Tap to reveal; swipe left for correct or right to revisit. Listen and Slow use a Mandarin voice available on the device. If audio is unavailable, download a Mandarin voice in iPhone accessibility voice settings and retry Listen. The preview is a browser trial; it does not install its own offline service worker.

## Listening quiz

Open Review → Listening quiz, or Scientific listening quiz in the STEM panel. Choose Everyday Chinese or Scientific Chinese, play the generated sentence, and select one of four English meanings. Characters, pinyin and the correct meaning appear after answering. Replay and Slow are available before and after the answer. Next sentence continues without a daily cap. The current question, answered state, topic totals and the last 100 sentence IDs are saved locally, so reopening does not count an answer twice.

Sentences are assembled locally from controlled grammatical patterns with changing people, actions, places, values and academic contexts. The generator avoids the previous 100 sentences and creates distractors from the same pattern. Scientific quantities stay internally consistent, including mass, volume and density. These are original learning exercises, rather than official CSCA past questions or a complete examination simulator. The first quiz supports everyday language and selected scientific contexts; it does not claim to exercise every catalog word.

Sentence generation and speech use no API keys or paid cloud service. A downloaded local Mandarin voice is required for speech. This preview still needs an initial online load and has no service worker for offline reopening; the daily-use app's existing offline support remains separate.

## Hosting

Serve this directory as a static site. For GitHub Pages, select the main branch and repository root in Settings → Pages. It has no build step and no API credentials. `index.html` loads `app.js`, `quiz.js`, `style.css`, `hsk-catalog.json`, `csca-catalog.json` and `stem-data.json` (only for earlier saves), plus an optional icon library from unpkg.com. Vocabulary attribution and licenses are linked in the page footer. `icon-concepts.html` compares three ImageGen horse proposals; they have not replaced the existing app icon.

## Stroke discovery update — 10 November 2026

Open any word in a gallery, or reveal a practice card, then choose Strokes. Next stroke draws one additional stroke and keeps every previous stroke visible. At the end the complete character stays on screen. Reset clears the drawing; Replay animates the complete character and leaves it visible. Words with several characters have individual character tabs. The bundled data covers all HSK 1–5 characters; an unsupported additional technical/personal character shows a clear availability message. The stroke renderer and data are served locally with this preview, with Hanzi Writer MIT and stroke-data Arphic notices included. The visible mode name is Flashcards; the existing internal normal-mode storage keys remain unchanged to preserve learning records.
