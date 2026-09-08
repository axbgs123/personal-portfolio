import writingArticles from '@src/constants/writingArticles';

const archivePages = {
  moreProjects: {
    code: 'PROJECTS',
    title: '更多项目',
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
    ],
  },
  tutorials: {
    code: 'TUTORIALS',
    title: '教程',
    intro: '课程资料、工具原文档、提示词资料与图文成品。翻开一册，查看已经整理的内容。',
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
        desc: '收录图像、视频、声音与知识工作等类别的 11 份工具原文档。',
        status: '持续更新',
        href: '/tutorials/ai-tools',
      },
      {
        meta: 'PROMPTS · 图像与视频',
        title: 'AI 提示词',
        desc: '保留 4 份生图资料的原分享入口与视频工具链接，不托管原视频。',
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
    title: '个人 Skill',
    intro: '把反复使用的方法沉淀成可以调用、组合和持续更新的个人能力模块，让经验不只停留在一次对话或一个项目里。',
    accent: '#ececec',
    keywords: ['个人 Skill', 'AI 工作流', '能力模块', '方法沉淀'],
    entries: [
      {
        meta: 'RESEARCH · 工作流',
        title: '深度研究与事实核查',
        desc: '从问题拆解、来源检索到证据校验，形成可追溯的研究过程。',
        status: '持续迭代',
      },
      {
        meta: 'CONTENT · 工作流',
        title: '内容研究与写作',
        desc: '把资料、观点和表达要求组织成适用于不同平台的完整内容。',
        status: '可用',
      },
      {
        meta: 'GEO · 方法',
        title: 'GEO 内容增长',
        desc: '围绕搜索需求、知识证据、内容生产和效果复盘建立增长链路。',
        status: '项目验证',
      },
      {
        meta: 'REVIEW · 方法',
        title: '内容复盘与评估',
        desc: '用统一维度记录发布前判断和发布后表现，让经验能够被校准。',
        status: '持续迭代',
      },
    ],
  },
  aigc: {
    code: 'AIGC',
    title: 'AIGC',
    intro: '围绕图像、视频、声音与交互内容进行生成式创作实验，关注的不只是生成结果，也包括风格控制、工作流和最终交付。',
    accent: '#e3e3e3',
    keywords: ['AIGC', 'AI 生图', 'AI 视频', '生成式创作'],
    entries: [
      {
        meta: 'IMAGE · 视觉实验',
        title: '生成式视觉与风格控制',
        desc: '从概念、构图到材质和色彩约束，生成能够进入真实项目的视觉素材。',
        status: '持续更新',
      },
      {
        meta: 'VIDEO · 动态内容',
        title: 'AI 视频与动态图形',
        desc: '组合生成素材、程序动画与剪辑节奏，制作短视频和产品演示。',
        status: '制作中',
      },
      {
        meta: 'WORKFLOW · 生产链路',
        title: '多模态内容工作流',
        desc: '连接文案、图像、配音、字幕与交付检查，减少重复制作成本。',
        status: '项目验证',
      },
      {
        meta: 'EXPERIMENT · 研究',
        title: '生成模型实验档案',
        desc: '记录不同模型、提示策略和后期处理方法的实际效果与边界。',
        status: '实验',
      },
    ],
  },
  photography: {
    code: 'PHOTOGRAPHY',
    title: '摄影',
    intro: '一些关于城市、光线和偶然时刻的观察。摄影是我离开屏幕之后，继续训练构图与节奏的方式。',
    accent: '#e2e2e2',
    keywords: ['摄影作品', '城市摄影', '视觉记录', '个人摄影'],
    entries: [
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
    code: 'WRITING',
    title: '文字与思考',
    intro: '记录我对 AI、科技与商业变化的观察。把新闻背后的矛盾拆开，也把尚未有答案的问题留在这里。',
    accent: '#e7e7e7',
    keywords: ['AI 观察', '科技评论', '商业思考', '个人写作'],
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
