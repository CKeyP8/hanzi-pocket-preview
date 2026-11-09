# Hanzi Pocket — Gallery & Collections preview

Live trial: https://ckeyp8.github.io/hanzi-pocket-preview/

A separate, interactive preview of the proposed STEM and collection features for Hanzi Pocket. It includes the full 3,600-entry HSK 1–5 catalog, six STEM subjects and four CSCA vocabulary-preparation topics. The 32 STEM terms are samples; this is not a complete CSCA mock exam.

The character library uses photo-like square tiles. Create your own collections, combine HSK, STEM and personal entries, and keep a word in several collections. Open a word to save it and choose collections, select several gallery tiles to organise them together, or add your own Chinese word with pinyin and meaning. The Groups panel shows album covers and category-only practice.

Normal review and reversed dictation work with all sources and custom collections. Each pass consumes its cards once, with missed words revisited on a later pass. Full Pocket practice continues into the last HSK level when the Pocket pass finishes; custom-collection practice stays within that collection. Undo also works across the Pocket-to-HSK transition. There is no daily review cap.

The daily-use app remains at https://ckeyp8.github.io/hanzi-pocket-web/ . This preview uses its own browser-storage key, `hanzi-pocket-preview-state-v2`, and does not open the main app's vocabulary database. It reads older preview-only saves and maps the ten former HSK sample IDs into the full catalog while preserving saved STEM terms and learning records. The old key is retained for rollback. Test progress stays in the current browser and does not synchronize across devices. Use Backup in My Pocket to download a preview JSON snapshot.

Open the preview in Safari on an iPhone. Select a subject or a CSCA preparation topic, choose Normal or Dictation, then start. Tap to reveal; swipe left for correct or right to revisit. Listen and Slow use a Mandarin voice available on the device. If audio is unavailable, download a Mandarin voice in iPhone accessibility voice settings and retry Listen. The preview is a browser trial; it does not install its own offline service worker.

Dynamic sentence-based listening quizzes are being discussed and are not included in this trial.

## Hosting

Serve this directory as a static site. For GitHub Pages, select the main branch and repository root in Settings → Pages. It has no build step and no API credentials. `index.html` loads `app.js`, `style.css`, `hsk-catalog.json` and `stem-data.json`, plus an optional icon library from unpkg.com. Vocabulary attribution and licenses are linked in the page footer. App icon concepts are being considered separately and have not replaced the existing app icon.
