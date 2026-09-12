# Project carousel and contact close

Scope: remove hero discipline line; rename archive label 更多项目 → 项目 without changing URLs; carousel all seven sourced product cases; refine contact footer. Original site and cat runtime remain untouched.

Frontend-design direction: maintain paper/ink/vermilion and existing type. One large project image at a time with a compact transport and source-labeled previews; no invented screenshots. English-interview case uses its supplied six-step flow. Footer compresses the generic statement into a two-line invitation and emphasizes the existing mail action; contact channels form three readable columns, with low-contrast typographic backdrop and motion-free fallback. QR asset is unchanged.

Carousel: 6.5-second interval only while visible, document visible, neither hovered nor focused. Explicit pause/resume; reduce-motion preference stops autoplay. Buttons wrap all seven cases, native button focus, horizontal touch swipe with vertical-scroll rejection. Observer and timer are disposed. Source captions separate concept art, prototype/demo, real footage and pending chat screenshots.

Cat research (2026-09-09): adryd325/oneko.js README, LICENSE and source reviewed: MIT code; sprite state table contains N/NE/E/SE/S/SW/W/NW, scratching, tired and sleeping. Prefer adapting this small engine rather than installing a second permanent pet. Asif10H/react-cursor-cat describes a lightweight React wrapper with cleanup. raynepaws/lots-o-nekos is a TypeScript constructable class alternative. Community skins need independent provenance/rights checks; MIT code should not be treated as blanket permission for arbitrary database artwork. No third-party code or sprites installed this round. Chat and piano accompaniment still require adaptation and aren't supplied by these cursor-cat packages.

References:
- https://github.com/adryd325/oneko.js
- https://github.com/adryd325/oneko.js/blob/main/LICENSE
- https://github.com/Asif10H/react-cursor-cat
- https://github.com/raynepaws/lots-o-nekos

Validation: 277 tests passed. Browser checked removal of hero label, seven slide choices, next-button synchronization, source captions, and the contact footer composition. Existing warning-only lint findings remain unrelated. Site stays local on 3003; no GitHub push or original-site edits.
