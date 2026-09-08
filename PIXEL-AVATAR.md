# 像素虚拟形象

- 方式：内置 imagegen 生图工具，未使用本地付费 CLI/API 密钥。
- 生成时间：2026-09-07。
- 用途：首页个人虚拟形象；不是本人照片或相貌复刻。
- 最终网站资源：`public/art/portrait-pixel-v1.png`。
- 3D 卡通试稿已被用户否定，未纳入网站。
- 构图参考 gpt-image 提示词库中的有限调色板、像素簇、无抗锯齿原则；本提示词为针对个人网站重新撰写。

## 最终提示词

```text
Use case: stylized-concept.
Asset: one finished pixel-art avatar illustration for a sharp monochrome personal portfolio, vertical 4:5 composition.
Create an original fictional adult male creator as a genuine hand-placed 2D PIXEL ART portrait. Underlying visual grid about 96 by 120 pixels, enlarged with NEAREST-NEIGHBOR rendering. Large clearly visible perfectly square pixel blocks, crisp stair-step contours, deliberately limited 8-tone BLACK WHITE GRAY palette. Retro 16-bit adventure-game portrait design with strong graphic silhouette, NOT a smooth 3D render and NOT a photorealistic image with a pixel filter.
Waist-up person, short slightly tousled black hair with distinctive blocky asymmetric fringe, simple dark pixel eyes, a relaxed confident subtle half smile; natural adult proportions, not a child or chibi. Charcoal work jacket over a paper-white T-shirt. Body slight three-quarter angle, face toward viewer-left. Entire head and both shoulders visible, about 12% breathing room above hair. Keep facial pixel design compact and tasteful, not heavily detailed or uncanny.
Background: flat very pale gray with a sparse ordered-dither shadow behind the shoulder, large empty space around silhouette. Pixel cluster shading, clean black edges; no smooth gradients, no antialiasing, no blurring. This should feel like an art-directed pixel character portrait in a minimalist design studio's portfolio.
No typography, no letters, no logos, no watermarks, no props, no devices, no extra characters, no colored pixels, no thick decorative frame, no interface screenshot, no collage, no 3D lighting or glossy skin. The portrait is an explicitly virtual identity, not a real-person likeness.
```
