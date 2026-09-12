// Lightweight snapshot of the existing portfolio, not article bodies.
// Sources: projects, archivePages, aiToolDocuments, illustratedTutorials,
// writingArticles, course/FAQ TOCs, and published illustrated-tutorial text.
// Refresh this metadata when adding or renaming content. No runtime fs or full-text import.
import { migratedProjectEntries, migratedPhotographyEntry, migratedShortDramaEntry } from './migratedPortfolio';
import writingArticles from './writingArticles';

export const searchCategories = [
  { id: 'all', label: '全部' },
  { id: 'projects', label: '项目' },
  { id: 'tutorials', label: '教程' },
  { id: 'writing', label: '口播稿' },
  { id: 'skills', label: 'Skill 与工作流提效' },
  { id: 'photography', label: '照片视频' },
];

export const searchDocuments = [
  {
    id: 'creator-monitor-automation',
    category: 'skills',
    title: '自媒体竞品追踪自动化',
    href: '/personal-skills/creator-monitor-automation',
    summary: '用 Codex、TikHub 和飞书 CLI 定时采集竞品账号、作品与评论，更新内容库、仪表盘和每日竞品日报。',
    detail: 'Skill 与工作流提效 · 竞品内容监控',
  },
  {
    id: 'github-remotion-talking-head-inserts',
    category: 'skills',
    title: 'Remotion 中文口播插入动画',
    href: '/personal-skills/remotion-talking-head-inserts',
    summary: '中文口播 Remotion 插入动画：素材规划、安全区适配、三阶段抽帧审查与示例成片。',
    detail: 'Skill 与工作流提效 · remotion-talking-head-inserts · GitHub',
  },
  {
    id: 'github-geo-seo-cn',
    category: 'skills',
    title: '中文网站 GEO / SEO 体检',
    href: '/personal-skills/geo-seo-cn',
    summary: '检查内容、技术、爬虫与平台可见性，输出可执行的整改清单。',
    detail: 'Skill 与工作流提效 · geo-seo-cn · GitHub',
  },
  {
    id: 'github-adcanvas',
    category: 'projects',
    title: 'AdCanvas',
    href: '/more-projects/adcanvas',
    summary: '基于 SankaiAI / TwitCanva，增加广告工作流、品牌约束、版本采用与交付检查，说明改造取舍并展示实际操作。',
    detail: '个人项目 · AI · 广告创意',
  },
  {
    id: 'github-open-llm-vtuber-companion',
    category: 'projects',
    title: 'Open LLM VTuber Companion',
    href: '/more-projects/open-llm-vtuber-companion',
    summary: '在 Open-LLM-VTuber 基础上协作扩展记忆、约定与主动陪伴，展示创建角色、保存背景和完成事项的实际操作。',
    detail: '个人项目 · open-llm-vtuber-companion · GitHub',
  },
  {
    id: 'photography-short-drama',
    category: 'photography',
    title: migratedShortDramaEntry.title,
    href: migratedShortDramaEntry.href,
    summary: migratedShortDramaEntry.desc,
    detail: migratedShortDramaEntry.meta,
  },
  ...migratedProjectEntries.map((entry) => ({
    id: `archive-${entry.slug}`,
    category: 'projects',
    title: entry.title,
    href: entry.href,
    summary: entry.desc,
    detail: entry.meta,
  })),
  {
    id: 'rag-model-review',
    category: 'projects',
    title: 'MiMo-V2.5 模型选型与产品决策复盘',
    href: '/more-projects/rag-copywriting#model-review',
    summary: '服装切片 RAG 工具内部的模型取舍、Prompt 迭代与未交付复盘。',
    detail: 'RAG 案例 · 决策复盘',
  },
  {
    id: 'photography-commercial-delivery',
    category: 'photography',
    title: migratedPhotographyEntry.title,
    href: migratedPhotographyEntry.href,
    summary: migratedPhotographyEntry.desc,
    detail: migratedPhotographyEntry.meta,
  },
  {
    id: 'projects-0',
    category: 'projects',
    title: 'AI 运营智能体与内容分析生成平台',
    href: '/projects/project1',
    summary: '面向抖音和小红书运营团队，从数据导入、分析诊断到内容生成，把分散的运营动作连接成一套可追溯的工作流程。',
    detail: 'AI 产品 · 运营工作台',
  },
  {
    id: 'projects-1',
    category: 'projects',
    title: '百言 GEO 内容增长系统',
    href: '/projects/project2',
    summary: '针对企业资料分散、内容生产与多平台分发脱节，建立从问题研究到分发收录、测量迭代的 GEO 内容增长流程。',
    detail: 'GEO · 内容增长',
  },
  {
    id: 'tutorials-2',
    category: 'tutorials',
    title: 'Codex 视频课配套资料',
    href: '/tutorials/codex-course',
    summary: '收录课程全文、原始配图、二级目录与配套附件，覆盖从安装到多智能体协作。',
    detail: 'CODEX · 完整资料',
  },
  {
    id: 'tutorials-3',
    category: 'tutorials',
    title: 'AI 工具',
    href: '/tutorials/ai-tools',
    summary: '按图像、视频、内容与知识工作流整理的 AI 工具入口与选择建议。',
    detail: 'AI TOOLS · 精选合集',
  },
  {
    id: 'tutorials-4',
    category: 'tutorials',
    title: 'AI 提示词',
    href: '/tutorials/ai-prompts',
    summary: '生图与视频提示词原始资料，保留原文和图片，视频使用链接。',
    detail: 'PROMPTS · 图像与视频',
  },
  {
    id: 'tutorials-5',
    category: 'tutorials',
    title: '图文教程',
    href: '/tutorials/illustrated',
    summary: '收录已经完成的图文教程发布版图片与对应文字。',
    detail: 'IMAGE + TEXT · 成品合集',
  },
  {
    id: 'tutorials-6',
    category: 'tutorials',
    title: 'Codex 常见问题与解决方案',
    href: '/tutorials/codex-faq',
    summary: 'Codex 安装、ChatGPT 会员订阅和 DeepSeek V4 接入的常见问题与完整解决方案。',
    detail: '常见问题',
  },
  {
    id: 'tutorials-7',
    category: 'tutorials',
    title: 'AI 写作工具',
    href: '/tutorials/ai-tools/writing',
    summary: 'AI 写作工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-8',
    category: 'tutorials',
    title: 'AI 图像生成与设计工具',
    href: '/tutorials/ai-tools/image-generation',
    summary: 'AI 图像生成与设计工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-9',
    category: 'tutorials',
    title: 'AI 图像处理工具',
    href: '/tutorials/ai-tools/image-editing',
    summary: 'AI 图像处理工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-10',
    category: 'tutorials',
    title: 'AI PPT 工具',
    href: '/tutorials/ai-tools/presentation',
    summary: 'AI PPT 工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-11',
    category: 'tutorials',
    title: 'AI 视频工具',
    href: '/tutorials/ai-tools/video',
    summary: 'AI 视频工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-12',
    category: 'tutorials',
    title: 'AI 思维导图工具',
    href: '/tutorials/ai-tools/mind-map',
    summary: 'AI 思维导图工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-13',
    category: 'tutorials',
    title: 'AI RAG 知识库工具',
    href: '/tutorials/ai-tools/rag',
    summary: 'AI RAG 知识库工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-14',
    category: 'tutorials',
    title: 'AI 数字人工具',
    href: '/tutorials/ai-tools/digital-human',
    summary: 'AI 数字人工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-15',
    category: 'tutorials',
    title: 'AI 文字转语音',
    href: '/tutorials/ai-tools/text-to-speech',
    summary: 'AI 文字转语音原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-16',
    category: 'tutorials',
    title: 'AI 换脸工具',
    href: '/tutorials/ai-tools/face-swap',
    summary: 'AI 换脸工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-17',
    category: 'tutorials',
    title: 'AI 其他工具',
    href: '/tutorials/ai-tools/other',
    summary: 'AI 其他工具原始资料。',
    detail: 'AI 工具 · 原始资料',
  },
  {
    id: 'tutorials-18',
    category: 'tutorials',
    title: 'AI 知识库图文教程',
    href: '/tutorials/illustrated/ai-knowledge-base',
    summary:
      '我以前的知识库只有一个作用： 证明我收藏过很多东西。 网页、PDF、课程和聊天记录存了一大堆，真正写报告、做方案时，还是要从搜索框重新开始。 后来才明白，问题不在Notion还是Obsidian，也不在文件夹建得够不够漂亮。 收藏只解决了“保存”。 真正能用的知识库，还要完成“加工”和“调用”。 我把现在使用的方法整理成了一套适合新手的流程： ❶ 先建一个主…',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-19',
    category: 'tutorials',
    title: 'Diagram Design Skill 教程',
    href: '/tutorials/illustrated/diagram-design',
    summary:
      '做方案时，我最不想碰的往往是流程图。内容已经有了，耗时间的是挪方框、拉连线，修改一个节点后又要重新排版。 这次我把 Diagram Design 从安装到导出完整跑了一遍。它可以安装到 Codex 或 WorkBuddy 里，支持流程图、泳道图、鱼骨图、甘特图和四象限等39种图形。生成的 HTML 和内联 SVG 仍然可以修改。 案例材料：一段35分钟的产品…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-20',
    category: 'tutorials',
    title: 'FDE 本质与实践',
    href: '/tutorials/illustrated/fde-practice',
    summary:
      '最近经常刷到 FDE。名字新，实际工作却很像把售前、实施、产品和工程揉进一个岗位里。 这组图文把岗位拆成几个具体问题： ① FDE 在客户现场到底负责什么 ② 工程、产品、售前、实施等背景分别要补什么 ③ 入行需要哪些能力，怎样用项目证明 ④ 一场项目从需求发现到生产上线怎么推进 ⑤ 第一个项目应该怎么选 ⑥ 如何同时验收业务结果与产品复用 里面用跨境电商投…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-21',
    category: 'tutorials',
    title: 'Luvvoice 声音克隆教程',
    href: '/tutorials/illustrated/luvvoice',
    summary:
      '最近发现一个声音克隆工具，打开网页就能用，不用装任何东西，注册就送免费额度。 录了20秒话，AI就有了我的声音。以后所有口播文案，写好文字→粘贴→选我的声音→生成→下载MP3。整个过程不超过5分钟。 工具叫 Luvvoice（luvvoice.com），下面是完整教程👇 【克隆声音】 左侧菜单 → Voice Cloning → 两种方式： ① Uploa…',
    detail: '7 张 · 图文教程',
  },
  {
    id: 'tutorials-22',
    category: 'tutorials',
    title: 'Nano Banana Pro 资料库介绍',
    href: '/tutorials/illustrated/nano-banana-library',
    summary:
      '我以前找AI生图提示词，最怕看到一大段关键词。 每个词都认识，但完全不知道最后会生成什么。复制进去不对，自己改两句又更不对。 最近我在翻一份160页的 Nano Banana Pro 案例提示词库，才发现更好用的资料，应该先让你看到结果。 它把产品电商、人像时尚、信息图、品牌海报、故事分镜、角色IP等场景分开整理。 每个案例都能先看成品，再看主体、场景、材质…',
    detail: '8 张 · 图文教程',
  },
  {
    id: 'tutorials-23',
    category: 'tutorials',
    title: 'PDF 复习套件教程',
    href: '/tutorials/illustrated/pdf-review-kit',
    summary:
      '最近在看《大语言模型基础》，前8章一共138页。内容从神经网络、数学工具，一直讲到Transformer、MoE、推理优化和GPU精度。顺着读一遍没问题，隔几天再回想，很多概念只剩下名字。 这次我把8个章节PDF放进Codex，整理成一套可以反复练习的复习资料。 第一遍只让它整理目录，确认8份文件都读到了；然后随机抽查4章，对照原页核对12个概念。确认内容能…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-24',
    category: 'tutorials',
    title: '归藏社交卡片 Skill 前向测试',
    href: '/tutorials/illustrated/social-card-test',
    summary:
      '这次拿一段真实的产品复盘材料，实际跑了一遍归藏社交卡片 Skill。 原始材料里有4项会议待办。我先规定3张卡各自负责什么：封面抓问题、责任表写清负责人和时间、复盘页保留后续要看的指标；再让 Agent 按1080×1440生成PNG。 图里放了完整安装方法、可复制的提示词、页面规划、原文到责任字段的前后对照，以及本次真实生成的3张卡。第一次运行时遇到了中文…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-25',
    category: 'tutorials',
    title: '公众号内容转知识库教程',
    href: '/tutorials/illustrated/wechat-knowledge',
    summary:
      '我用 wechatDownload 把公众号文章整理成 Markdown，再交给 Codex 清洗、建索引、检索。 这篇按实际操作顺序拆开： 1. 复制一篇目标文章的链接 2. 粘贴到工具，获取公众号 ID 3. 用微信内置浏览器完成验证 4. 选择 Markdown / HTML / PDF 等格式 5. 先小范围试跑，再按时间范围整理 6. 用 Code…',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-26',
    category: 'tutorials',
    title: '一本书做成 AI 知识库',
    href: '/tutorials/illustrated/book-to-knowledge',
    summary:
      '这次不讲“把一本书丢给AI”这种大概念，我直接拿《金字塔原理》跑了一次。 我锁定的是南海出版公司2019年版，只处理第1篇第1章里的一个知识点： “自上而下，结论先行”。 先用正版公开目录核对章节和两个小标题，再生成2个片段、1张知识卡。随后拿一段带数字的演练周报测试：3家供应商、3组响应时间、2个待确认字段、两个时间节点，要求AI在不改任何事实的前提下重新…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-27',
    category: 'tutorials',
    title: '多智能体协作',
    href: '/tutorials/illustrated/multi-agent',
    summary:
      '很多人听过“多智能体协作”，理解却是：同时打开几个聊天框，让它们互相复制粘贴。 那不叫协作，最多算一场AI线上围观。 真正的协作，至少要回答四个问题：任务能不能拆？谁负责哪一步？上一步交付什么给下一步？最后怎么验收？ 按我整理的这套工作方式，Raft更像一个协作层：浏览器里下达目标，本地电脑负责落地，Claude、Codex、DeepSeek等模型或智能体分…',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-28',
    category: 'tutorials',
    title: '小红书内容导入 Obsidian',
    href: '/tutorials/illustrated/obsidian-import',
    summary:
      '刷到干货就收藏，过几天再想找，常常只剩一句：我到底收藏到哪里了？ 如果你在用 Obsidian，可以用 Xiaohongshu Importer Plus 把小红书分享文本或笔记链接导入知识库，生成 Markdown 笔记，并按设置保存图片、来源和 Frontmatter。 先说边界：这套流程适合个人学习和内部整理。请保留作者与原始链接，不要把他人笔记、配图…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-29',
    category: 'tutorials',
    title: '早耳实时字幕教程',
    href: '/tutorials/illustrated/hayamimi',
    summary:
      '开会、上课或看英文视频时，想把声音实时转成文字，又不想每次都把录音上传到云端，可以试试早耳（Hayamimi）。 它是一款在电脑本地运行的实时字幕工具。首次把模型下载好以后，语音识别不需要联网；说话时可以在浏览器里看到字幕，确认后的内容还能自动追加保存为 TXT 文件。 这套图文把操作拆成了几步： 1. 先看懂字幕面板上的临时字幕、确认文本和延迟信息； 2.…',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-30',
    category: 'tutorials',
    title: '知乎 CLI 保姆级教程',
    href: '/tutorials/illustrated/zhihu-cli',
    summary:
      '知乎推出了官方 CLI Skill。装进支持 Skill 的 Agent 工具后，可以直接搜索知乎内容、读取热榜、调用知乎直答；完成账号授权后，还能整理自己的作品、关注和近期收藏。 这次不只做安装演示，我用官方 CLI 把授权、搜索、热榜、直答和近期收藏都真实跑了一遍。小白可以按顺序操作： 1. 准备电脑、Agent 工具和知乎账号； 2. 从知乎官方地址安…',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-31',
    category: 'tutorials',
    title: '11 个可落地 Skill',
    href: '/tutorials/illustrated/practical-skills',
    summary: '11 个可落地 Skill图文教程。',
    detail: '12 张 · 图文教程',
  },
  {
    id: 'tutorials-32',
    category: 'tutorials',
    title: 'AI 原文档转可编辑 PPT',
    href: '/tutorials/illustrated/document-to-ppt',
    summary: 'AI 原文档转可编辑 PPT图文教程。',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-33',
    category: 'tutorials',
    title: '《厚黑学》制作个人 Skill',
    href: '/tutorials/illustrated/book-to-skill-houhei',
    summary: '《厚黑学》制作个人 Skill图文教程。',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-34',
    category: 'tutorials',
    title: 'Codex 换肤 Skill 教程',
    href: '/tutorials/illustrated/codex-theme',
    summary: 'Codex 换肤 Skill 教程图文教程。',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-35',
    category: 'tutorials',
    title: 'Codex 简历筛选工作流',
    href: '/tutorials/illustrated/resume-screening',
    summary: 'Codex 简历筛选工作流图文教程。',
    detail: '8 张 · 图文教程',
  },
  {
    id: 'tutorials-36',
    category: 'tutorials',
    title: 'Codex 脏 Excel 经营看板',
    href: '/tutorials/illustrated/excel-dashboard',
    summary:
      '每月做经营分析，最耗时间的往往不是看结论，而是先把几张格式不同、字段不同、缺值不同的表整理到能用。 这篇按 Excel 实战课程里的经营看板案例重组：两张订单表分别来自直营网店和第三方平台，再用客户档案补齐客户等级，最后完成字段统一、跨表合并、利润计算、异常校验和 HTML 看板。 你可以直接照着这条链路做： 盘点 → 清洗 → 合并 → 计算 → 校验 →…',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-37',
    category: 'tutorials',
    title: '非暴力沟通 AI 知识库',
    href: '/tutorials/illustrated/nvc-knowledge-base',
    summary: '非暴力沟通 AI 知识库图文教程。',
    detail: '10 张 · 图文教程',
  },
  {
    id: 'tutorials-38',
    category: 'tutorials',
    title: '飞书 AI 资讯选题库',
    href: '/tutorials/illustrated/feishu-topic-library',
    summary: '飞书 AI 资讯选题库图文教程。',
    detail: '9 张 · 图文教程',
  },
  {
    id: 'tutorials-39',
    category: 'tutorials',
    title: '第一节：Codex 的下载、安装和基础使用',
    href: '/tutorials/codex-course#第一节-codex-的下载-安装和基础使用',
    summary: '二选一： (需要科学环境)codex官方下载链接：https://chatgpt.com/codex/ 国内下载链接：https://codexapp.agentsmirror.com/ <h2',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-40',
    category: 'tutorials',
    title: '第二、三节：看懂Codex工作台（上）+（下）',
    href: '/tutorials/codex-course#第二-三节-看懂codex工作台-上-下',
    summary: '项目、session、模型、权限、插件 Goal、Plan、定时、远程、worktree <h2',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-41',
    category: 'tutorials',
    title: '第四、五节：Codex做精美PPT（上）+（下）：',
    href: '/tutorials/codex-course#第四-五节-codex做精美ppt-上-下',
    summary:
      '一、Image2生图模型做PPT · 二、用HTML 做PPT · 4个方法：我该用哪种？ · Image2生图版本：gpt-image2-ppt-skills和awesome-gpt-image-2 HTML版本：frontend-slides和 ppt-skills 一、Image2生图模型做PPT 方法一：使用gpt-image2-ppt-skills…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-42',
    category: 'tutorials',
    title: '第六节：必懂知识：Skill=skill.md+references+scripts+asset',
    href: '/tutorials/codex-course#第六节-必懂知识-skill-skill-md-references-scripts-asset',
    summary: '一、skill.md+references+scripts+asset · 二、案例讲解 · Codex-Skill课程手绘图-10页.pptx 一、skill.md+references+scripts+asset 二、案例讲解 <h2',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-43',
    category: 'tutorials',
    title: '第七节：Codex Excel 实战：数据清洗、计算、分析、可视化与skill沉淀',
    href: '/tutorials/codex-course#第七节-codex-excel-实战-数据清洗-计算-分析-可视化与skill沉淀',
    summary:
      '大纲 · 业务场景 · 提示词汇总 · 重要知识点 · 课程小结 · 大纲 脏表数据 → 数据清洗 → 统一口径+多表合并 → 公式计算 → 生成可视化html看板 → 和codex协作的坑+注意事项→整个过程封装为skill、html等可复用→如何写出优秀的skill 业务场景 这是一家办公数码销售公司的月度经营分析。公司有两个销售渠道，自营商城和第三方平…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-44',
    category: 'tutorials',
    title: '第八节：Codex自媒体实战：热点选题skill+文案脚本skill',
    href: '/tutorials/codex-course#第八节-codex自媒体实战-热点选题skill-文案脚本skill',
    summary:
      '一、热点选题skill：ai_hot_content_curator · 二、文案脚本skill：media-copywriter · 一、热点选题skill：ai_hot_content_curator 仓库地址：https://github.com/Stephen-creater/ai-hot-content-curator-skill 如何基于该ski…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-45',
    category: 'tutorials',
    title: '第九节：Codex自媒体实战：小红书图文生成自动化',
    href: '/tutorials/codex-course#第九节-codex自媒体实战-小红书图文生成自动化',
    summary:
      '如何判断一个skill是否值得采纳？ · 一、xhs-note-creator-skill · 二、guizang-social-card-skill · 如何判断一个skill是否值得采纳？ star数，实际使用人数，更新频率，社区反馈 输入输出的case，是否符合自己的预期 作者本人是否高频使用，且效果不错 skill适合上手即用，或者方便二创 一、xh…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-46',
    category: 'tutorials',
    title: '第九节：YouTube内容提炼+改写+多平台配图（Ins、LinkedIn、X）',
    href: '/tutorials/codex-course#第九节-youtube内容提炼-改写-多平台配图-ins-linkedin-x',
    summary:
      '本节使用的两个 Skill · 实操流程 · 本节目标 ：输入一条 YouTube 链接，输出经过中文改写、可用于 Instagram、LinkedIn 和 X 的信息图。 本节使用的两个 Skill Skill 作用 产物 baoyu-youtube-transcript 提取字幕、章节、封面和视频信息 结构化逐字稿 baoyu-infographic 把…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-47',
    category: 'tutorials',
    title: '第十节：Codex自媒体实战：Video-use+Hyperframes实现视频剪辑与生成自动化',
    href: '/tutorials/codex-course#第十节-codex自媒体实战-video-use-hyperframes实现视频剪辑与生成自动化',
    summary:
      '一、Video-use实现剪辑自动化 · 二、Hyperframes实现视频素材生成自动化 · 一、Video-use实现剪辑自动化 video-use解读：https://mp.weixin.qq.com/s/5ehwdcq5BHkavFiIX23nwA ae1d34f576d44fec9b5567fe4c74cb0e.mp4（视频原文件未嵌入网页） 原视…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-48',
    category: 'tutorials',
    title: '第十一节：Codex浏览器自动化：原生Control Chrome+进阶Ego-lite+应用快照Appshot',
    href: '/tutorials/codex-course#第十一节-codex浏览器自动化-原生control-chrome-进阶ego-lite-应用快照appshot',
    summary:
      '一、原生Codex Control Chrome（@浏览器） · 二、进阶玩法：Ego-lite（/ego-browser） · 三、应用快照Appshot · 一、原生Codex Control Chrome（@浏览器） 安装+导入cookie+使用场景 案例一、找携程酒店（耗时40min） @浏览器 打开携程官网，搜索三亚大东海附近最受欢迎的 10 家酒…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-49',
    category: 'tutorials',
    title: '第十二节：Codex Computer Use实战：操作桌面软件+Record&Replay沉淀skill',
    href: '/tutorials/codex-course#第十二节-codex-computer-use实战-操作桌面软件-record-replay沉淀skill',
    summary:
      '一、Computer Use操作桌面软件 · 二、Record & Replay in Codex · 一、Computer Use操作桌面软件 安装 官网介绍 https://www.youtube.com/watch?v=D_FCYsshMI4 案例一、简单任务 @电脑 看我当前桌面壁纸，用GPT-image-2生成一张同风格的新壁纸，帮我替换 @电脑 …',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-50',
    category: 'tutorials',
    title: '第十三节：Codex多智能体协作：子智能体、并行分工、Ultra模式',
    href: '/tutorials/codex-course#第十三节-codex多智能体协作-子智能体-并行分工-ultra模式',
    summary:
      '官方介绍 · 案例 · Ultra模式 · 官方介绍 https://learn.chatgpt.com/docs/agent-configuration/subagents?surface=app 案例 我要制作一期关于 Codex Subagents 的视频，目标观众是不懂编程、看不懂英文，但已经会使用基础 AI 工具的技术小白。 当前阶段只做深度资料调…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-51',
    category: 'tutorials',
    title: '第十四节：Codex+飞书（Lark）CLI：玩转多维表格、飞书白板、手机飞书操控Codex',
    href: '/tutorials/codex-course#第十四节-codex-飞书-lark-cli-玩转多维表格-飞书白板-手机飞书操控codex',
    summary:
      '一、飞书CLI（Lark） · （仅大陆）二、补充：知识星球cli · 一、飞书CLI（ Lark ） 帮我安装飞书官方cli：https://github.com/larksuite/cli ps：手机上也要下飞书，要扫码授权电脑。可以先注册飞书个人版。 案例一、Agent + 飞书 CLI + 多维表格 = 内容选题工作流 官方介绍：https://ww…',
    detail: 'Codex 视频课 · 章节',
  },
  {
    id: 'tutorials-52',
    category: 'tutorials',
    title: '一、安装问题',
    href: '/tutorials/codex-faq#一-安装问题',
    summary:
      'codex在win10系统安装失败 · 系统环境问题，导致安装包打不开 · mac无法验证问题，如图 · codex界面显示英文？ · codex在win10系统安装失败 解决方案： 系统环境问题，导致安装包打不开 解决方案：用workbuddy智能体解决 1.下一个workbuddy智能体（https://www.workbuddy.cn/） 2.用微信登…',
    detail: 'Codex 常见问题 · 章节',
  },
  {
    id: 'tutorials-53',
    category: 'tutorials',
    title: '二、如何订阅 ChatGPT 会员？',
    href: '/tutorials/codex-faq#二-如何订阅-chatgpt-会员',
    summary:
      '为什么需要订阅 · 前提条件 · 方法一：苹果礼品卡（最稳定，推荐优先尝试） · 方法二：土耳其区 App Store（第三方经验，价格优先） · 方法三：安卓 Google Play（备选） · 常见问题 · 订阅后验证 · 为什么需要订阅 免费版 ChatGPT 可以体验基础对话，但 Codex 功能（包括桌面 App、生图模型、多 agent 并行、原…',
    detail: 'Codex 常见问题 · 章节',
  },
  {
    id: 'tutorials-54',
    category: 'tutorials',
    title: '三、Codex 接入 DeepSeek V4（保姆级教程）',
    href: '/tutorials/codex-faq#三-codex-接入-deepseek-v4-保姆级教程',
    summary:
      '方案一，cc-switch · 方案二，Codex++ · 两种方案怎么选 · 几个常见问题 · 方案一用 cc-switch，配置最少。 方案二用 Codex++，图形化界面，喜欢点点点的可以选。 两个都能让 Codex 用上 DeepSeek，挑一个跟着做就行。 方案一，cc-switch 下载安装 已经装过的可以跳过，但要确保升级到 3.16.0 及以…',
    detail: 'Codex 常见问题 · 章节',
  },
  ...writingArticles.map((article) => ({
    id: `writing-${article.slug}`,
    category: 'writing',
    title: article.title,
    href: `/writing/${article.slug}`,
    summary: article.excerpt,
    detail: article.meta,
  })),
  {
    id: 'skills-70',
    category: 'skills',
    title: '深度研究与事实核查',
    href: '/personal-skills',
    summary: '从问题拆解、来源检索到证据校验，形成可追溯的研究过程。',
    detail: 'Skill 与工作流提效 · RESEARCH · 工作流',
  },
  {
    id: 'skills-71',
    category: 'skills',
    title: '内容研究与写作',
    href: '/personal-skills',
    summary: '把资料、观点和表达要求组织成适用于不同平台的完整内容。',
    detail: 'Skill 与工作流提效 · CONTENT · 工作流',
  },
  {
    id: 'skills-72',
    category: 'skills',
    title: 'GEO 内容增长',
    href: '/personal-skills',
    summary: '围绕搜索需求、知识证据、内容生产和效果复盘建立增长链路。',
    detail: 'Skill 与工作流提效 · GEO · 方法',
  },
  {
    id: 'skills-73',
    category: 'skills',
    title: '内容复盘与评估',
    href: '/personal-skills',
    summary: '用统一维度记录发布前判断和发布后表现，让经验能够被校准。',
    detail: 'Skill 与工作流提效 · REVIEW · 方法',
  },
];

const normalize = (value) =>
  String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
const preparedDocuments = searchDocuments.map((document) => ({
  document,
  title: normalize(document.title),
  summary: normalize(document.summary),
  detail: normalize(document.detail),
}));

// Every space-separated term must occur in a title, description, or source label.
// Case, full-width letters, and spacing do not affect Chinese/English matching.
export function searchArchive(query = '', category = 'all') {
  const terms = String(query).trim().split(/\s+/).map(normalize).filter(Boolean);
  return preparedDocuments
    .filter(({ document }) => category === 'all' || document.category === category)
    .map((entry) => {
      const text = entry.title + entry.summary + entry.detail;
      if (!terms.every((term) => text.includes(term))) return null;
      const score = terms.reduce((sum, term) => {
        if (entry.title === term) return sum + 100;
        if (entry.title.includes(term)) return sum + 20;
        if (entry.detail.includes(term)) return sum + 6;
        return sum + 2;
      }, 0);
      return { ...entry.document, score };
    })
    .filter(Boolean)
    .sort((first, second) => second.score - first.score);
}
