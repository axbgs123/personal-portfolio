# 2026-09-08 · 头像与桌面猫生成记录

## 执行方式

使用 Codex 内置 image_gen 生图模型，不使用 CLI/API Key。原站和旧资产均保留。

## 年轻版像素头像

- 编辑目标：`public/art/portrait-pixel-v1.png`（虚拟形象，并非用户本人照片）
- 最终资产：`public/art/portrait-pixel-young-v2.png`
- 使用位置：`src/constants/profilePortrait.js`
- 原始模型输出：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-0686d998-69e2-4de2-b7b7-097b7d7c3ed9.png`

### 最终提示词

```text
Use case: precise-object-edit. Asset: original virtual pixel portrait for a sharp monochrome personal portfolio.
Input image 1 is the edit target, an AI-generated fictional avatar, not a real person's photograph.
Create a new 4:5 portrait version. Primary change: make this same virtual character clearly read as a 20–22-year-old Chinese university student / young creative technologist rather than an established older professional. Slightly shorter, softer lower face, clean-shaven skin, lighter youthful brows, more relaxed eyes and a small natural closed-mouth smile. Reduce heavy cheek and jaw shadows, no beard or stubble or creases. Keep a normal young-adult body, not a child, not chibi.
Keep the existing black-and-white pixel-art medium with crisp visible square pixels and a limited 8–12-tone neutral grayscale palette. Keep tousled black hair but soften it into a casual light fringe. Replace the heavy formal-looking utility jacket with a simple unbranded dark casual overshirt over a white crew-neck T-shirt, relaxed student styling.
Preserve the three-quarter upper-body pose looking slightly left toward the page title, complete hair silhouette, central-right body framing and modest headroom. Plain light neutral gray background, minimal pixel dissolve only along the far shoulder edge, no added objects, no frame, logos, letters, captions or watermark.
Avoid photorealism, smooth 3D rendering, mature angular model jaw, suit, leather jacket, exaggerated cute child proportions, colored pixels. This is a younger redesign of the supplied fictional avatar, while retaining its monochrome character and site-compatible framing.
```

## 桌面猫行走

- 设计参照：将原站墨墨猫的坐姿 SVG 渲染为 `tmp/cat-reference.png` 后交给生图模型。
- 原始 8 帧模型输出：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-c4153c37-a9e3-4b23-bcae-9270edf9286d.png`
- 模型把透明背景画成了棋盘格；针对透明化的第二次生成仍非真正 alpha，未采用。
- 用户已明确授权本地抠图、切帧和对齐，保留生成的猫、不重新绘制。
- 后处理脚本：`scripts/prepare-cat-walk.mjs`。导出资产与检测结果见该脚本及生成记录。
- 最终网页图集：`public/art/cat-walk-atlas.webp`，8 帧，3072×384；透明无损备份：`public/art/cat-walk-atlas.png`。
- 原始生成图副本：`public/art/cat-walk-generated-source.png`；对齐数据/透明点击区：`public/art/cat-walk-frames.json`；黑白背景检查图：`tmp/cat-walk-contact-sheet.png`。
- 行走画面来自生成帧，网页代码只负责按真实位移推进帧、翻转朝向、停步切换；坐姿、乐器和聊天逻辑不更换为生成角色。

### 最终采用的生成提示词

```text
Use case: stylized-concept / game animation asset. Input image 1 is the exact character design reference: the website pet cat Momo. Generate a SINGLE sprite sheet containing EIGHT chronological keyframes of one seamless, calm four-legged walking cycle to the RIGHT.
Canvas: landscape 2:1, organized as a mathematically regular 4-column × 2-row grid of equal SQUARE cells. Exactly ONE complete cat in each cell, eight cats total. No grid lines, frame numbers, text, labels, borders or watermark. All pixels outside the cats must be genuinely transparent alpha, NOT a checkerboard or solid-colored background. No floor, shadows or scenery.
The cat must be unmistakably the SAME character as reference: large rounded black head, two tall triangular black ears with gray inner ears, the two small tufts between ears, broad white muzzle and thin pointed white blaze on nose, black expressive eyes with tiny white highlights, small black triangular nose, simple smile and fine gray whiskers. Tail curves upward with a small white TIP. Four small white paws.
Critical coat rule: the SIDE of the torso, the back and the BELLY are SOLID BLACK. The ONLY white patch below the head is a SMALL SHORT throat/NECK bib immediately beneath the jaw at the FRONT. Never stretch this bib across the flank or down the belly. Keep white muzzle, white paws and tail tip.
Pose/style: a genuine walking SIDE VIEW facing RIGHT, with a slight three-quarter turn of the large head so the same recognizable face remains visible. Short rounded black torso, large familiar head, small four legs. Do not make a long adult realistic cat or change the face into another character. Flat crisp vector-like black/white/neutral-gray illustration exactly like the supplied reference, clean silhouette.
Animation: eight distinct evenly spaced phases in reading order, from first row left to right then second row. Anatomically plausible four-beat cat walk, legs articulate from shoulder and hip, paws alternate plant/lift/swing with different front/back leg phases; NO sideways crab-walk, NO hopping, NO dancing. Every cell identical scale, identical head/body design and identical horizontal center. Feet contact a common baseline at 86% of each cell height; cat is roughly 74% of cell width and 77% of cell height with safe whitespace on every side. Only legs, tiny body bob and slight tail sway change across frames. Head remains level and same size; the last frame leads smoothly back to first. No overlaps between cells, no cropped tail or ears.
```
