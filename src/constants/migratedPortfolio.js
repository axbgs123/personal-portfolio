// Metadata for the three requested archive cases; full original content is
// loaded server-side from migrated-portfolio.json, not into the global menu.
export const migratedProjectEntries = [
  {
    key: 'matrix',
    slug: 'rag-copywriting',
    meta: 'RAG · 产品原型',
    title: '抖音服装切片 RAG 智能文案生成工具',
    desc: '连接商品事实、历史素材、账号风格、风控与剪映字段导出。保留 PRD、竞品分析与 MiMo-V2.5 选型复盘，明确未交付 MVP 的边界。',
    status: '查看案例',
    href: '/more-projects/rag-copywriting',
    linkLabel: '查看完整案例',
    image: {
      src: '/migrated-portfolio/product/rag-demo-workbench.png',
      alt: 'RAG 文案工具的演示工作台，指标为目标或待验证值',
      width: 2552,
      height: 1308,
      fit: 'contain',
    },
  },
  {
    key: 'drama',
    slug: 'ai-interview',
    meta: 'AI · 英语面试练习',
    title: 'AI 英语面试模拟产品',
    desc: '从场景选择、出题朗读、录音识别到反馈与追问，围绕一次完整的英语面试练习设计产品闭环。收录原 PRD、流程和能力说明。',
    status: '查看案例',
    href: '/more-projects/ai-interview',
    linkLabel: '查看完整案例',
    preview: {
      title: '一次完整的英语面试练习',
      steps: ['选择场景', '生成题目', '录音回答', '手动修正', 'AI 反馈', '继续追问'],
    },
  },
];

export const migratedPhotographyEntry = {
  key: 'photo',
  meta: '活动摄影 · 视频交付',
  title: '商业活动摄影与视频交付',
  desc: '极色妝婳亚洲赛与广之旅供应商年会。按项目查看真实照片和交付说明。',
  status: '查看作品',
  href: '/photography/commercial-delivery',
  linkLabel: '查看完整交付',
  image: {
    src: '/migrated-portfolio/photo/jise-05.webp',
    alt: '极色妝婳亚洲赛 05',
    width: 1279,
    height: 1921,
    fit: 'contain',
  },
};

export const migratedShortDramaEntry = {
  key: 'shortDrama',
  meta: '真人短剧 · 拍摄与后期',
  title: '真人竖屏短剧拍摄与剪辑调色',
  desc: '55 集真人竖屏短剧，参与部分场景副机位，并负责第 20–25 集剪辑调色。收录海报、成片与原素材。',
  status: '查看作品',
  href: '/photography/short-drama',
  linkLabel: '查看短剧作品',
  image: {
    src: '/migrated-portfolio/drama/cover-02.webp',
    alt: '丈夫的婚姻保卫战短剧海报',
    width: 538,
    height: 952,
    fit: 'contain',
  },
};
