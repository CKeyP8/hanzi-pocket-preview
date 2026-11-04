# Hanzi Pocket — STEM & CSCA preview

Live trial: https://ckeyp8.github.io/hanzi-pocket-preview/

A separate, interactive preview of a proposed STEM panel for Hanzi Pocket. It includes six subject collections, four CSCA vocabulary-preparation topics, normal review, reversed dictation cards, saving selected words and separate progress by source and practice mode. All 42 terms in this trial are sample content; it is not the full HSK catalog or a complete CSCA mock exam.

The daily-use app remains at https://ckeyp8.github.io/hanzi-pocket-web/ . This preview uses its own browser-storage key and does not open the main app's vocabulary database. Test progress stays in the current browser and does not synchronize across devices.

Open the preview in Safari on an iPhone. Select a subject or a CSCA preparation topic, choose Normal or Dictation, then start. Tap to reveal; swipe left for correct or right to revisit. Listen and Slow use a Mandarin voice available on the device. If audio is unavailable, download a Mandarin voice in iPhone accessibility voice settings and retry Listen. The preview is a browser trial; it does not install its own offline service worker.

Dynamic sentence-based listening quizzes are being discussed and are not included in this trial.

## Hosting

Serve index.html as a static page. For GitHub Pages, select the main branch and repository root in Settings → Pages. It has no build step and no API credentials. The standalone presentation wrapper loads optional icon and tooltip libraries from unpkg.com.
