# 网页素材压缩（2026-09-09）

不改变页面设计、交互和内容。本轮仅替换教程图片和三条创亿鸭视频。

| 范围 | 原始字节 | 压缩后字节 | 方式 |
| --- | ---: | ---: | --- |
| 184 张教程 PNG | 43,750,446 | 22,419,144 | 无损 WebP，逐张解码 RGBA 像素完全相等 |
| 3 条创亿鸭视频 | 140,382,023 | 46,903,622 | H.264 CRF 20，最长适配 1920×1080 / 1080×1920，音轨直接复制，faststart |
| public 全部文件 | 339,486,901 | 224,677,198 | 减少 114,809,703 字节，约 33.8% |

全部 public 文件按实际字节计算为 323.76 → 214.27 MiB；磁盘分配空间由 du 显示为约 326 → 218 MiB。统计不包含依赖和构建缓存。

## 原件与恢复

原件保留在项目根目录 `.media-originals/2026-09-09/`，内部路径对应 public；已通过 .gitignore 排除，不应部署或加入 Git。

- 图片原件：`illustrated-tutorials/<slug>/<编号>.png`。恢复时复制到 public 对应路径，并把 src/constants/illustratedTutorials.js 的 webp 后缀改回 png（原有 jpg 不变）。
- 视频原件：`migrated-portfolio/ip/dragon-boat-blessing.mp4`、`campus-cultural-tech-space.mp4`、`school-aesthetic-day.mp4`。恢复时复制到 public 同名位置。
- 逐文件压缩报告位于 `tmp/media-compression-report.json`。

因为保留原件，本地总占用不等于部署目录的节省量。未压缩二维码、已有小图、低码率活动回顾和短剧视频。

## 验证

- 184 张图片已逐张验证解码后像素一致，删除 public PNG 前再次验证备份字节完全一致。
- 生产构建通过；仍有原有 Hook / img 等 lint 警告。
- 首页、AIGC、Diagram Design 教程页面 HTTP 200；教程 WebP 在浏览器中正常加载。
- 三条视频均在 Chrome 中读取尺寸、时长并实际播放成功，保留原时长。
