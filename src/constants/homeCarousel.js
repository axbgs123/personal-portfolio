import projects from './projects';
import { migratedProjectEntries } from './migratedPortfolio';

const homeCarousel = [
  ...projects.map((project) => ({ ...project, source: '概念封面 · 详情内含真实界面' })),
  ...migratedProjectEntries.map((entry) => ({
    id: entry.slug,
    title: entry.title,
    category: entry.meta,
    summary: entry.desc,
    img: entry.image?.src,
    link: entry.href,
    steps: entry.preview?.steps,
    source: entry.image ? entry.image.alt : '产品流程预览 · 非界面截图',
  })),
  {
    id: 'adcanvas',
    title: 'AdCanvas',
    category: 'AI 广告创意 · 开源二次开发',
    summary: '在通用生成画布上增加广告工作流、品牌约束、版本采用和交付检查。',
    img: '/repository-cases/adcanvas-workflow.png',
    link: '/more-projects/adcanvas',
    source: '本地操作截图 · 尚未执行付费素材生成',
  },
  {
    id: 'open-llm-vtuber-companion',
    title: '中文 AI 伴侣',
    category: '持续陪伴 · 协作二次开发',
    summary: '在 Open-LLM-VTuber 基础上扩展角色记忆、约定管理与主动陪伴。',
    img: '/repository-cases/companion-persona-use.png',
    link: '/more-projects/open-llm-vtuber-companion',
    source: '角色配置演示 · 聊天截图待补充',
  },
];

export default homeCarousel;
