# Repository case studies — evidence and scope

Use frontend-design guidance within the established case-study design: paper #f6f6f6, ink #090909, muted #686868, divider #cdcdcd, vermilion #d74436; existing display/body faces. Initial idea of four new layouts was rejected before implementation because consistency with the existing cases matters more here. Reuse the case reader: title → contents/sidebar + introduction → original screenshot → explanation → scope and source. Preserve source image ratios and existing keyboard-accessible anchors. No generated covers or new decorative UI.

## Evidence inventory

- AdCanvas: original front end at 5174 and backend at 3001, isolated clone. Native demo brand ÉLAN; used UI to create full workflow through local deterministic planner and fill brand constraints. No paid generation or API keys. Workbench, populated workflow and brand screenshots captured on 2026-09-09. Earlier empty-canvas screenshot is not used in the case.
- Companion: original companion_ui and init_companion_routes mounted in a temporary FastAPI entry point at 12394. Real default configuration and persistence API. Saved two explicitly labeled demonstration memories through UI. No mocked responses. LLM, VRM, audio cloning and auto-conversation not started; do not imply complete model runtime verification.
- Remotion: ffmpeg extracts at t=7s from existing FDE and search-intent example MP4 files in the user's Skill assets. Source clips not recreated or represented as fresh output.
- GEO: original `output/sample/report-20260908-112632.md`, rendered verbatim using Markdown tables in a temporary reader at 12395. Screenshots are report-output evidence, not an invented product dashboard. Keep scores, date and unavailable platform states. 68 is readiness, not indexing or citation success.

## Attribution and publication

AdCanvas upstream README and NOTICE were read. Original Apache-2.0 LICENSE/NOTICE retained, derivative changes added to Chinese/English README and NOTICE. Upstream author SankaiAI explicitly named. Gitleaks 8.30.1 scanned 192 commits before publication and reported no leaks; this is a scan result, not an absolute security guarantee. Commit `33b3cef` pushed, repository description amended and visibility verified PUBLIC. No upstream notification sent; NOTICE's commercial-use request is disclosed.

Companion: attribute Open-LLM-VTuber and component-specific licenses. GEO: attribute Zubair Trabzada / geo-seo-claude, MIT. Do not conflate upstream work with the user's modifications.

Temporary clones, local services and dependencies live under `/tmp/portfolio-evidence.oxuilo`; remove after screenshots and verification. Do not delete the user's existing Skill sources or reports. Retain only selected evidence images in the portfolio.

Closeout: all temporary services stopped; ports 3001, 5174, 12394 and 12395 have no listeners. Temporary directory moved to `~/.Trash/portfolio-evidence-20260909-oxuilo` for recoverable removal; unused empty-canvas image also moved to Trash. Four production detail URLs return 200 on port 3003. Build and 273 tests passed. Existing user Skill assets and GEO report were not changed.

## Revision: personal contribution and scenario evidence

User rejected generic feature descriptions and default admin screenshots. Retained the existing case-reader design under frontend-design guidance; no new layout or generated imagery.

- AdCanvas now explains the inherited canvas vs advertising-specific changes: workflowTemplate.ts (three routes and ten business node types), brandRules.ts (inheritance/override and deterministic required/prohibited term checks), versioning.ts (save/adopt/branch and descendant stale propagation), and task/quality/handoff scope. Do not describe deterministic term checks as comprehensive visual/legal review.
- Companion now separates upstream voice/ASR/Live2D from the collaborative companion layer. Checked COMPANION_FEATURES.md, memory_records.py and the real continuity routes. Repository-level evidence does not establish individual authorship of each line: preserve collaboration attribution rather than claiming sole development.
- Reused isolated original UI/API at 12394. Via UI created 小岚｜作品集复盘搭档（演示）, reopened saved persona, saved four manual memories about portfolio work, created two dated commitments and completed one. New PNGs: companion-persona-use, companion-memory-use, companion-commitments-use, each 820×771. These replace default screens in the case and archive cover.
- No simulated assistant replies, fabricated chat history, fake model-online badges or imported private user data. Full chat/VRM evidence remains outstanding; requested the user's existing configured runtime path asynchronously. Do not represent this revision as completing model conversation screenshots.
- Production build .next-usage-final succeeded; 274 tests passed. Existing unrelated lint warnings remain. Verified live companion route, new image, and directory anchor on port 3003. Temporary service stopped and isolated directory returned to recoverable Trash after capture.
