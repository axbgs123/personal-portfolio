# 猫连续性与独立设计小样 · 2026-09-08

## 范围

仅 V2 源码；原站目录不动。3002 仍运行旧构建，本次在 3003 独立预览。新增 /design-lab 与 /archive-machine，不替换现有仓库入口、文章及图文内容。

## 生图与处理

原生 image_gen.imagegen 调用，无额外生成 API/CLI。两套均以已存在的整猫生成帧为视觉参考。用户已明确允许透明化、切帧、全猫对齐；不拆分身体部件、无局部骨骼变形、无模糊和光流补帧。

步行原图：`public/art/cat-continuity-walk-v2/generated-source.png`。
过渡原图：`public/art/cat-continuity-transition-v2/generated-source.png`。
处理脚本：`scripts/prepare-cat-continuity.mjs`。

生成结果不是可靠的逐相位动画：步行12格中有重复姿势，预览候选仅选 [3,1,11,2,5]，不能把12格说成12个均匀相位。转身9号没有生成左立，故使用4→5→6→7→镜像6→镜像5→镜像4（仅整帧镜像）。转身背景被模型烘焙为棋盘格，通过边界连通区域抠除，保留黑色轮廓内白毛。步行以绿幕差值透明化。全部统一脚底基线352，384px画布；整套共享缩放，不逐帧拉伸身体。

耳部锚点最初扫描65px误纳入尾尖，引起横移，已缩至32px；最终步行高度289–293px，站立281px，仍应以实机视觉判断而非测试数量宣称完美。

## Exact native prompts

### Walk

Use case: stylized-concept. Production 2D animation asset: ONE COMPLETE CAT WALK CYCLE, not a character pose collection. Landscape canvas, exact 4 columns by 3 rows = 12 equally-sized cells. Every cell contains the SAME COMPLETE kitten, side view facing RIGHT, moving in place. Use image 1 as the exact character identity and drawing style. Cute compact black tuxedo kitten with large round head, identical ears/eyes/muzzle, rounded paws, black torso and legs, small white neck patch ONLY under the jaw, white muzzle/paws/tail tip. No white belly or side torso. Each cat fully visible with margin; same head/body dimensions and the same foot baseline in all 12 cells. Head position anchored; tiny natural vertical weight shift only. No detached parts.
Critical: this must play as a smooth looping quadruped walk, 12 DISTINCT evenly spaced moments over ONE gait cycle, not 12 copies of a forward-reaching paw. Front and hind legs have staggered phase. Near forepaw must clearly plant and move back under the shoulder through stance, then lift/bend back, pass under the chest and swing forward; far forepaw does opposite. Rear legs also independently plant and lift, no sideways crab movement. Ground is invisible. Body weight remains convincing, four identifiable legs, no extra feet or ghost feet.
Cell sequence row-major: 1 near forepaw modest forward contact; 2 paw fully planted and shoulder travels forward; 3 planted near forepaw now below shoulder; 4 planted paw behind shoulder and pushing off; 5 near forepaw lifted and folded back; 6 flexed paw passing beneath chest; 7 near forepaw reaching forward off floor while far forepaw planted below shoulder; 8 near forepaw extending toward next contact; 9 lowering toward ground while rear legs pass; 10 light near forepaw contact farther forward with body lowered slightly; 11 weight transfers onto that paw as opposite feet lift; 12 a distinct in-between pose just BEFORE cell1, so frame12→1 makes the same small change as other adjacent frames. Prioritize anatomical phase continuity and consistent drawings over following literal phase text if necessary to form a real cycle.
Artwork: clean crisp black/white/gray filled hand-drawn cartoon shapes, exactly image1 style, not pixel art, not 3D, no redesign. Transparent alpha background if supported; do not draw any checkerboard. No shadows, ground lines, text, labels, numbers, borders, props, fur texture or motion blur. If genuine transparency cannot be provided, use perfectly uniform pure green #00FF00, never a checkerboard. Keep all 12 cats completely separated and fully within their cells.

### Transition

Use case: stylized-concept. Production animation SPRITE SHEET of the SAME COMPLETE CAT transforming naturally between sitting, standing, and turning. Exact square grid 4 columns by 3 rows = 12 equal cells, row-major. Every cell is the same complete kitten, not parts. Input image1 is the current seated front three-quarter identity; image2 is the same kitten's right-facing walking identity. Preserve their round face, eyes, black fur, small white neck bib, white muzzle/paws/tail tip, compact young proportions and crisp monochrome cartoon linework. Black torso: NO white belly or side patch. Do not stretch the head or change the character across cells. Full body/paws/tail in every cell, common character scale and common ground baseline, enough empty margin. No detached pieces.
Cell1: seated matching image1, looking gently right.
Cell2: leaning chest forward and turning head right, forepaws still planted, preparing to rise.
Cell3: hips lift halfway, hind legs unfold while forepaws carry weight, face rotates toward right profile.
Cell4: hips rise almost fully, body length extends naturally to right-facing four-legged stance, knees still slightly bent.
Cell5: stable right-facing four-legged standing neutral, all paws at rest, same proportions as image2, near forepaw under shoulder. This is the end of the rising clip.
Cell6: right-facing head turns slightly toward viewer, near forepaw begins pivot, body still mostly side-on.
Cell7: right-front three-quarter standing midturn, both shoulders now visible.
Cell8: standing facing viewer, all four feet natural, NOT seated; central pivot frame.
Cell9: left-front three-quarter standing midturn, body rotated further.
Cell10: left-facing standing neutral, exact mirror anatomy/scale of cell5. End of turn.
Cell11: right-facing short final walking step, near forepaw lowering just ahead of shoulder, rear feet gathering, slowing down.
Cell12: right-facing all paws settling into stable standing pose close to cell5, very small final change. Cells11→12→5 are a stop clip.
The artist must portray actual weight transfer and natural rotations in these full drawings, not cut-and-paste or paper flipping. Between seated and standing views the black torso stays one continuous animal. No body parts chart, no independent head/leg drawings, no extra legs, no white abdomen, no instrument, no text/labels/numbers/frame borders, no ground line, no shadows, no glow or blur. Transparent alpha background if possible; never draw checkerboard. If true transparency is unavailable, perfectly uniform #00FF00 green.

## 色彩对照

独立页面在同一几何布局中原位切换黑白与 #D74436 朱红。点缀色不承担唯一状态说明，保留文字、边框、位置和焦点。未将色彩自动应用到全站。

## 仓库方向

用户选择黑白档案机。小样仅用真实文章标题、原文摘录和既有链接；抽签非智能推荐，搜索可直接到达，不强制玩游戏。

## 验证与运行

- 本轮现有 7 套测试合计82/82通过（猫、开场、原仓库、前后端边界、聊天、配色），另新增档案机回归12/12通过，合计94项；不是动画美术质量评分。
- 档案机实际浏览器验证：拉杆下拉73px出签、Enter第二次出签、上一张/下一张不增加计数、FDE搜索命中文章与图文、两条真实详情路由打开、浏览器返回恢复已看计数和当前纸带。
- 1440px桌面与390px手机检查，无横向溢出，原封面加载成功。配色两模式同构图；手机断点有效。
- 猫实际浏览器观测到 rise→walk 和 walk→stop→stand→turn→walk；转身经正面帧后才镜像，非瞬间掉头；点击透明轮廓可即时打开聊天。DeepSeek仍未配置，页面如实显示未接通。
- 钢琴预设播放时实际观察到吉他整猫帧8/9按节拍交替，停止演奏可用并已停止测试播放。
- 生产构建成功，67条静态页面；只有原代码既存的Hook/console lint警告。本轮页面、组件和helper单独lint通过。
- 3003使用新构建 `.next-archive-continuity-preview`，本轮结束时服务器会话93646。3002仍为 `.next-whole-cat-final`，未重启/覆盖；原站git状态与开工前一致。

本次是独立交互小样，不代表仓库全站已迁移。步态五帧尚存在生成轮廓差异，须由使用者体验后再决定替换3002。
