# 2026-09-08 · 首屏融合与猫步态素材修订

## 生成与使用方式

本轮使用内置生图模型，不调用本地 API Key。头像为编辑模式，猫为参考角色生成模式。旧素材全部保留。用户已明确允许对生成猫素材进行本地透明化、裁切、对齐，不允许借此重绘猫；步态由生成的身体部件组合及关节变换驱动。

### 头像
- 参考：`public/art/portrait-pixel-young-v2.png`
- 生成输出：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-2ebc2b97-1fab-45f4-a888-423c059c8d82.png`
- 项目文件：`public/art/portrait-pixel-paper-v3.png`
- 保留年轻像素人物，仅把矩形灰底改为纯白，网页通过 multiply 与底色融合。不是本人照片；可访问性说明保留，头像下方可见说明删除。
- 完整提示词：

```text
Use case: precise-object-edit / background-extraction. Image 1 is the edit target: an AI-generated fictional young adult pixel portrait, not a real photograph. Change ONLY the backdrop and edge integration. Keep the exact same young face, hair, pose, casual overshirt, body proportions, expression, pixel grid and all internal grayscale shading. Remove the gray rectangular backdrop and the gray checker/pixel dissolve floating outside the shoulder. Put the unchanged character on a perfectly uniform PURE WHITE RGB 255,255,255 background, with a crisp natural pixel-art silhouette; no gray haze, no paper texture, no shadows outside the character, no frame, no text, no checkerboard. Preserve the 4:5 framing, full hair and complete upper body down to the current bottom edge. White skin/shirt details must stay intact. This file will be multiply-composited onto a neutral website backdrop, so background pixels must be actual pure white and have no visible rectangular gray card. Do not redesign, rejuvenate or beautify the character again. Do not change the portrait into vector or photorealism.
```

### 猫的分层步态
- 参考：`tmp/cat-reference.png`
- 生成原图：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-9dd74f76-0284-4d77-b5e8-b8b3e1198fc5.png`
- 输出是 4 × 2 的绿幕部件图，不是八幅完整走路姿态。绿幕在本地透明化，身体、头、尾和腿部仍使用生成原图。
- 项目原图：`public/art/cat-rig-v2/generated-source.png`；透明素材：同目录body/head/tail/foreUpper/foreLower/hindUpper/hindLower/paw.png；轮廓与尺寸：manifest.json。
- 处理脚本：`scripts/prepare-cat-rig.mjs`；步态：`src/lib/catWalkRig.mjs`；预览：`tmp/cat-rig-contact-sheet.png`、`tmp/cat-rig-walk-preview.gif`。本地只抠图/切分/对齐；SVG仅组合生成PNG和不可见点击轮廓，不重画猫。
- 六项步态回归覆盖左右和两种显示比例的真实触地坐标、四足相位、骨长与脚底、素材透明度和侧身黑毛；生产网页通过左右行走、单击聊天、乐器联动检查。
- 原先八帧的前爪未完成后蹬、后爪突然换位，调帧率不能解决，所以不继续使用那组素材来伪装步态。
- 完整提示词：

```text
Use case: stylized-concept. Asset: a production-ready CUTOUT PUPPET PARTS ATLAS for a walking web pet, not a storyboard and NOT eight full cats. Input image 1 is the exact original cat character design reference.
Canvas landscape 2:1, regular FOUR columns by TWO rows, eight equal square cells. Exactly one ISOLATED body part centered in each cell, generous empty margins, no parts touching another cell. Background completely uniform bright chroma-key GREEN #00FF00 only, no shading, no checkerboard, no borders or labels. This green will be removed locally; the cat itself must use ONLY black, white and neutral gray.
Match the reference’s crisp flat two-dimensional vector-like illustration: big triangular black ears with light gray inner ears, the two little tufts, black fur, white face blaze/muzzle, gray whiskers, warm friendly black eyes. No new character. No 3D, no blur, no realistic fur, no shadows.
Exact cell order, left to right, top to bottom:
1. TORSO ONLY of this cat in a natural quadruped right-facing side view: a horizontal rounded black bean body, rump on the LEFT and shoulders on RIGHT, subtly fuller rump, straight-ish back and curved belly. No head, NO legs, NO tail, no face or patches. Entire side/back/belly PURE BLACK. Rough aspect ratio 1.9:1.
2. HEAD ONLY including a tiny white throat bib just under the jaw. Same recognizable cat head, tall triangular ears, two little tufts. Turn the WHOLE face into a convincing right-facing three-quarter PROFILE: nose and white muzzle protrude RIGHT, eyes look RIGHT in the direction of walking, the farther eye partly occluded; not looking straight at viewer. Preserve reference facial identity and black/white markings. No torso, arms, feet or tail. Small white neck bib only at bottom front, not a big chest.
3. TAIL ONLY: black, smoothly curved upward, small WHITE TIP, root at bottom RIGHT so it can attach to the cat’s left rump and curve up behind toward LEFT. No body or limbs.
4. FRONT UPPER LEG ONLY: one thick short black upper foreleg, vertical straight down, subtly tapering, smoothly rounded overlapping joint ends at TOP CENTER and BOTTOM CENTER. No paws. Flat black, narrow gray edge only if needed. Rough aspect ratio 1:2.0.
5. FRONT LOWER LEG ONLY: one slim black foreleg segment pointing vertically DOWN, rounded joint ends at TOP CENTER and BOTTOM CENTER, no paw, no body, no bend. Rough aspect ratio 1:2.4.
6. HIND UPPER THIGH ONLY: one black rounded teardrop thigh pointing DOWN, fuller round top joint at TOP CENTER, narrower rounded knee at BOTTOM CENTER, rough aspect ratio 1:1.8. No body, feet or lower leg.
7. HIND LOWER LEG ONLY: one slim black calf/shin segment pointing vertically DOWN, gently tapered, overlapping round joint ends at TOP CENTER and BOTTOM CENTER, no paw, no bend. Rough aspect ratio 1:2.5.
8. PAW ONLY: a small white side-view rounded cat foot pointing RIGHT with a short black ankle centered at the TOP, a near-flat horizontal sole at bottom, fine neutral gray toe details. Black outline enough to preserve the white fill. No rest of leg. Rough width:height 1.3:1.
These eight parts will be assembled with skeletal transforms. Each part needs full clean uncut silhouette and joint overlap, no props, floating fur fragments or written labels. Forelegs and hindlegs must be separated into the specified pieces. Do not draw an assembled cat anywhere.
```
