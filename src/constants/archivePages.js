import writingArticles from '@src/constants/writingArticles';
import { migratedProjectEntries, migratedPhotographyEntry, migratedShortDramaEntry } from '@src/constants/migratedPortfolio';
import aigcWorks from './aigcWorks';

const archivePages = {
  moreProjects: {
    code: 'PROJECTS',
    title: '项目',
    intro: '汇总当前已整理的产品案例，详情包含项目说明与界面。',
    accent: '#eaeaea',
    keywords: ['AI 运营智能体与内容分析生成平台', '百言 GEO 内容增长系统', '产品案例'],
    entries: [
      {
        meta: '2026 · 产品负责人 / AI 协作开发',
        title: 'AI 运营智能体与内容分析生成平台',
        desc: '面向抖音和小红书运营团队，串联数据导入、分析诊断、内容生成与人工审核。',
        status: '查看案例',
        href: '/projects/project1',
      },
      {
        meta: '2026 · GEO 方法与产品策划负责人',
        title: '百言 GEO 内容增长系统',
        desc: '连接问题研究、事实准备、答案生成、分发收录与测量迭代，组织企业 GEO 内容增长流程。',
        status: '查看案例',
        href: '/projects/project2',
      },
      ...migratedProjectEntries,
      {
        meta: 'AI · 广告创意与生产',
        title: 'AdCanvas',
        desc: '基于 SankaiAI / TwitCanva，将通用生成画布改造成广告生产流程：三路线提案、品牌约束、版本采用与交付检查。',
        status: '本站案例 · 开源二次开发',
        href: '/more-projects/adcanvas',
        linkLabel: '查看完整案例',
        image: {
          src: '/repository-cases/adcanvas-workflow.png',
          alt: 'AdCanvas 本地实际创建的广告工作流',
          fit: 'contain',
        },
      },
      {
        meta: 'AI · 数字人伴侣',
        title: 'Open LLM VTuber Companion',
        desc: '在 Open-LLM-VTuber 基础上协作扩展持续陪伴：可核对的记忆、可接续的约定，以及不打扰的主动话题策略。',
        status: '本站案例 · 开源二次开发',
        href: '/more-projects/open-llm-vtuber-companion',
        linkLabel: '查看完整案例',
        image: {
          src: '/repository-cases/companion-persona-use.png',
          alt: '实际创建并保存的复盘搭档小岚，含人设与交流边界',
          fit: 'contain',
        },
      },
    ],
  },
  tutorials: {
    code: 'TUTORIALS',
    title: '教程',
    intro: '课程资料、工具介绍、提示词资料与图文成品。翻开一册，查看已经整理的内容。',
    accent: '#dedede',
    keywords: ['Codex 教程', 'AI 工具', 'AI 提示词', '图文教程'],
    entries: [
      {
        meta: 'CODEX · 完整资料',
        title: 'Codex 视频课配套资料',
        desc: '收录课程全文、原始配图、二级目录与配套附件，覆盖从安装到多智能体协作。',
        status: '已完结',
        href: '/tutorials/codex-course',
      },
      {
        meta: 'AI TOOLS · 精选合集',
        title: 'AI 工具',
        desc: '收录图像、视频、声音与知识工作等 11 类工具的介绍与链接。',
        status: '持续更新',
        href: '/tutorials/ai-tools',
      },
      {
        meta: 'PROMPTS · 图像与视频',
        title: 'AI 提示词',
        desc: 'GPT Image、Nano Banana 与 Midjourney 飞书资料；Seedance 提示词整理中。',
        status: '精选',
        href: '/tutorials/ai-prompts',
      },
      {
        meta: 'IMAGE + TEXT · 成品合集',
        title: '图文教程',
        desc: '收录已经完成的图文教程发布版图片与对应文字。',
        status: '21 组',
        href: '/tutorials/illustrated',
      },
    ],
  },
  personalSkills: {
    code: 'PERSONAL SKILLS',
    title: 'Skill 与工作流提效',
    intro: '把反复使用的方法沉淀为可调用的 Skill 和自动化工作流，让经验能够复用，让内容与业务执行更高效。',
    accent: '#ececec',
    keywords: ['Skill 与工作流提效', 'AI 工作流', '自动化', '方法沉淀'],
    entries: [
      {
        meta: 'CODEX + TIKHUB + 飞书 CLI',
        title: '自媒体竞品追踪自动化',
        desc: '定时采集抖音与小红书对标账号、作品和评论，去重写入飞书多维表格，更新榜单与仪表盘，并在每天早上推送竞品日报。',
        status: '自动化工作流',
        href: '/personal-skills/creator-monitor-automation',
        linkLabel: '查看完整工作流',
        image: {
          src: '/repository-cases/creator-monitor/daily-report.webp',
          alt: '飞书竞品内容日报卡片',
          fit: 'contain',
        },
      },
      {
        meta: 'REMOTION · 口播插入动画',
        title: 'Remotion 中文口播插入动画',
        desc: '从中文科技、AI 与商业口播稿中选择适合视觉化的段落，制作竖屏插入动画，包含素材规划、安全区适配、三阶段抽帧审查与批量渲染。',
        status: 'GitHub Skill',
        href: '/personal-skills/remotion-talking-head-inserts',
        linkLabel: '查看介绍与实际成片',
      },
      {
        meta: 'GEO / SEO · 中文网站审计',
        title: '中文网站 GEO / SEO 体检',
        desc: '检查中文网站的内容、技术、爬虫与平台可见性，输出可执行的整改清单。',
        status: 'GitHub Skill',
        href: '/personal-skills/geo-seo-cn',
        linkLabel: '查看介绍与审计报告',
      },
    ],
  },
  aigc: {
    code: 'AIGC',
    title: 'AIGC',
    intro: 'AI 视频与生成式视觉。把成片和画面，留在同一面墙上。',
    accent: '#e3e3e3',
    keywords: ['AIGC', 'AI 生图', 'AI 视频', '创亿鸭'],
    entries: aigcWorks.map((work) => ({
      title: work.title,
      meta: work.category,
      desc: work.type === 'video' ? 'AI 视频成片' : '网站主视觉',
    })),
  },
  photography: {
    code: 'PHOTO / VIDEO',
    title: '照片视频',
    intro: '从商业活动的关键瞬间，到视频和短剧的后期交付。这里保留真实拍摄作品，也留下一些仍在整理的观察方向。',
    accent: '#e2e2e2',
    keywords: ['摄影作品', '城市摄影', '视觉记录', '个人摄影'],
    entries: [
      migratedPhotographyEntry,
      migratedShortDramaEntry,
      {
        meta: '城市',
        title: '城市边缘',
        desc: '建筑、空地与正在改变用途的空间。',
        status: '系列',
      },
      {
        meta: '夜间',
        title: '夜间散步',
        desc: '路灯、橱窗和雨后街道留下的颜色。',
        status: '系列',
      },
      {
        meta: '海岸',
        title: '海岸线',
        desc: '风、石头和不断改变边界的水面。',
        status: '短篇',
      },
      {
        meta: '室内',
        title: '工作室光线',
        desc: '物件、阴影与一天中缓慢移动的自然光。',
        status: '记录',
      },
    ],
  },
  writing: {
    code: 'SCRIPTS',
    title: '口播稿',
    intro: '围绕 AI、科技与商业变化完成的口播稿。这里保留选题、观点和适合镜头表达的内容结构。',
    accent: '#e7e7e7',
    keywords: ['AI 口播稿', '科技内容', '商业观察', '短视频脚本'],
    entries: writingArticles.map((article) => ({
      meta: article.meta,
      title: article.title,
      desc: article.excerpt,
      status: article.status,
      href: `/writing/${article.slug}`,
    })),
  },
};

export default archivePages;
