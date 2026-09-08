# 完整猫精灵帧 · 2026-09-08

用户明确要求不要拆猫身体零件，改用完整精灵帧，并参考GitHub提高效率。本轮全面停止运行时部件/IK路线，旧资产和脚本保留备份，不再作为当前功能验收证据。

## 生成方式

内置image_gen；角色参考生成。只保留整只猫的完整帧。得到用户许可后，进行绿幕透明化、整帧裁切、统一尺度/底线和图集打包；没有拆身体、重新画腿或合成关节。

- 风格参考：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-805f7222-3b99-4756-a86c-387923b81c52.png`
- 8走路原图：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-d911b1e0-4774-4a68-a50c-2217eaee9257.png`
- 16状态/乐器原图：`/Users/baiyan1/.codex/generated_images/01a032f7-46ac-7293-8a92-76964aa17972/exec-470bf79f-c78b-4af9-88aa-5d60cf4dcc78.png`
- 项目素材：`public/art/cat-sprite-soft-v1/`、`public/art/cat-sprite-actions-v1/`，各有原始生成图、完整单帧、WebP图集及带各帧轮廓的manifest。
- 处理脚本：`scripts/prepare-cat-sprite-soft.mjs`，`--actions`处理4×4状态表；默认处理4×2走路表。
- 整帧预览：`tmp/cat-sprite-soft-v1/walk.gif`；contact分别为上述tmp目录与`tmp/cat-sprite-actions-v1/contact.png`。

## GitHub参考与选择

- [oneko.js，固定版本](https://github.com/adryd325/oneko.js/blob/5281d057c4ea9bd4f6f997ee96ba30491aed16c0/oneko.js)：借鉴动作帧表、循环索引、图集偏移和低频播放的设计。MIT。没有直接加载其IIFE、监听或猫素材；保留现有React清理、聊天和钢琴接口。仅设计参考，非源码拷贝。
- [oneko LICENSE](https://github.com/adryd325/oneko.js/blob/5281d057c4ea9bd4f6f997ee96ba30491aed16c0/LICENSE)保留MIT版权要求；如未来复制源码必须随项目附完整许可。
- [SpriteKit](https://github.com/PizzaLater/SpriteKit)：参考完整素材→抠图→选帧/对齐→导出PNG/JSON的资产流程；该工具不修复源动画的角色抖动，因此不能用打包通过冒充步态自然。
- [desksprite](https://github.com/welltilln/desksprite/blob/43c7437672ea589a0f184284f0900299be004e67/desksprite.js)：仅评估生命周期，没有接入字符栅格渲染或拖拽系统，避免抢走点猫聊天行为。

未安装新的运行时引擎，未上传图片，未改API密钥。

## 8帧走路完整提示词

```text
Use case: stylized-concept. Asset: one animation SPRITE SHEET of the kitten in Image 1, specifically the RIGHT-HAND side-view kitten, not the sitting view.
Canvas contract: landscape 2:1, EXACTLY FOUR columns by TWO rows, eight equal square cells. One COMPLETE right-facing cat in each cell, never cropped or touching cell borders. No text, cell lines, labels or numbers. Solid uniform CHROMA GREEN #00FF00 backdrop, no gradients, no ground shadow. Green is only background; all cat colors black/white/neutral gray.
Preserve the exact appealing character design of the right-hand kitten: short rounded thick black torso, chunky curved legs and large rounded white sock paws, round cheeks, curved little muzzle, large calm single side-view eye looking right, same white face stripe, small white throat bib, two tiny top tufts, dark ears with gray inner ears, upright curved black tail with a white tip. Keep the neck naturally merged into the shoulders. All back/flank/belly BLACK. Do NOT turn it into the old long-body skinny-legged cat. No skinny stick legs, segmented robot joints, thin neck, long snout or body stretching. Clean flat 2D illustration with crisp contours.
Registration: exactly SAME head size, torso length, location of shoulder/hip, gaze and framing in all eight cells. Draw as an ANIMATOR'S one-cycle WALK, not eight concept poses. The torso remains at the same horizontal center and all planted paw soles meet the same ground baseline 86% down each cell. Head stays at the same location with at most 1% body bob. Tail subtly swings only. All four legs remain attached consistently.
READING ORDER left-to-right top row, then bottom row. The near front leg and near back leg must make a full support-to-swing cycle, while far legs are half a cycle offset. Near front paw coordinates relative to shoulder progress visibly:
Frame 1: near forepaw plants AHEAD of shoulder at ground; near hindpaw starts lifting from BEHIND hip.
Frame 2: near forepaw supports slightly AHEAD of shoulder on ground; near hindpaw swings FORWARD off ground.
Frame 3: near forepaw planted DIRECTLY UNDER shoulder; near hindpaw lands AHEAD of hip.
Frame 4: near forepaw supporting clearly BEHIND shoulder; near hindpaw supports in front of hip.
Frame 5: near forepaw at backmost support, BEHIND shoulder, heel beginning to release; near hindpaw planted UNDER hip.
Frame 6: near forepaw lifted and curled, moving FORWARD underneath shoulder; near hindpaw supporting BEHIND hip.
Frame 7: near forepaw swings AHEAD of shoulder, off ground; near hindpaw at backmost support.
Frame 8: near forepaw extended forward just about to plant (returns seamlessly to frame1); near hindpaw starts releasing rear foot.
The far foreleg follows the SAME trajectory offset four frames, and far hindleg follows its same trajectory offset four frames. At least two paws support the body at all times. Keep all legs thick, softly bent and naturally organic, matching source. It is a soft four-legged kitten walking on its own feet, not skating, floating, dancing or marching like a human.
Only frame pose changes; keep identical facial design, coat pattern and one coherent character across the whole sheet. No duplicate still pose across eight cells. Fully model-drawn complete frames; no disassembled body parts. Large air margins around all tails and ears.
```

## 16帧状态完整提示词

```text
Use case: stylized-concept. Create one complete CHARACTER SPRITE SHEET, square canvas, EXACTLY 4 columns × 4 rows = 16 equal square cells. A FULL complete cat (including paws, ears and tail) in every cell, no cropped silhouettes, no labels or grid lines. Background uniformly bright chroma GREEN #00FF00. No text, ground shadows, backdrop, ornaments or divider lines.
Image 1 is the character identity reference. Use the LEFT sitting kitten's soft rounded design consistently throughout: compact small rounded black torso, thick paws with white socks, large round black head with soft triangular gray-inner ears, two tiny tufts, big friendly almond eyes and black pupils, distinctive tapered white face stripe/muzzle, tiny nose, a short white bib just under chin, black tail with small white tip. Same face, fur markings and body size in all cells, not 16 different designs. Short soft anatomy, never stick legs, long torso, narrow neck seam or puppet joints. Crisp flat two-dimensional black/white/neutral-gray illustration, with no blur, gradients, rendering or realistic fur. Every frame must be an entirely drawn cat; not isolated parts.
All cats centered in their cell, same head size, all lowest supporting paws at 88% cell height, ears comfortably below 9% top margin. For the first eight states use front/slightly three-quarter facing to show its face. Exactly this reading order left-to-right then next row:
ROW 1:
1. SIT: relaxed upright sitting, forepaws together, eyes open, friendly neutral tiny smile.
2. BLINK: identical sitting silhouette and placement as cell1, both eyes gently closed.
3. PET: same sitting placement, eyes closed happily, head slightly tilted, one front paw loosely lifted beside chest.
4. YAWN: same sitting placement, sleepy closed eyes, mouth a small open yawn.
ROW 2:
5. GROOM: sitting, lifting one white paw to lick it near cheek.
6. STRETCH: cat stretching forelegs forward low on floor with raised haunches, natural cat stretch, same body/face design.
7. SLEEP: peacefully curled up with head resting on forepaws and black tail curled around body, white face visible, no Z letters.
8. GREET: sitting upright, one thick white forepaw raised beside face in greeting, eyes open.
ROW 3:
9. GUITAR A: same sitting cat holding a small grayscale acoustic guitar in front, one paw on neck, other paw above strings. Whole cat plus instrument fully visible.
10. GUITAR B: exactly same cat/instrument position as cell9, only strumming paw moved down over strings. No stage.
11. DRUM A: same sitting cat with small round grayscale drum in front, both paws holding tiny drumsticks above drumhead. Whole cat visible.
12. DRUM B: exactly same cat/drum location as cell11, one stick touches drumhead, other is raised. No effects lines.
ROW 4:
13. KEYBOARD A: same sitting cat behind miniature grayscale electronic keyboard, white paws rest on left and right keys. Whole cat and miniature keyboard visible.
14. KEYBOARD B: exactly same cat/keyboard location as cell13, one paw lifted a little and the other pressing a key.
15. SHAKERS A: same sitting cat holding one little grayscale egg shaker in each white forepaw, both paws at mid-chest level.
16. SHAKERS B: identical cat placement to cell15, one paw slightly raised and one slightly lowered, holding the same egg shakers.
Do not introduce bipedal legs, human hands, costumes, icons, note symbols or extra objects. Instrument pairs must have exactly matched body, head and props dimensions, only small paw/action change. The sheet is for a monochrome designer website pet, so prioritize charming coherent silhouette and clean real animation-ready spacing over extra detail.
```

# 落地验证补记

当前运行时为一个整猫图集 image，配合每帧透明点击轮廓，不再运行分件/IK。8 帧走路随位移循环；16 个动作帧包含坐姿、眨眼、被摸、哈欠、洗脸、伸懒腰、睡觉、招呼，以及吉他/鼓/键盘/沙锤各两帧。没有打滚帧，因此入口如实更名为伸懒腰。

59 项当前测试、生产构建及真实浏览器行走/聊天/钢琴联动通过；原 rig 测试仅存档，不算当前通过数。3002 使用 `.next-whole-cat-final`，原站未覆盖。素材预处理在缩放后去除残留绿边，透明度与整猫轮廓保留；脚本支持 `--actions` 使用已有源图重建。
