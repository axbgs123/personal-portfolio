import AiResourceGuide from '@src/pages/tutorials/components/AiResourceGuide';

const page = {
  title: 'AI 提示词',
  eyebrow: 'IMAGE + VIDEO · 精选资料',
  lead: '只留下能直接影响画面与镜头的提示结构。',
  description: '生图提示词资料与视频生成工具链接。',
  keywords: ['AI 提示词', '生图提示词', '视频提示词', 'Midjourney 提示词', 'AI 视频生成'],
  accent: '#e4e4e4',
  heroWords: ['SUBJECT', 'SCENE', 'LIGHT', 'CAMERA', 'MOTION', 'RHYTHM'],
  stats: [
    { value: '2', label: '提示词分类' },
    { value: '4', label: '生图资料入口' },
    { value: '8', label: '视频工具链接' },
  ],
  note: '本页不收录对话、写作等通用提示词。资料文件仍保留在原分享入口；视频不上传到本站，仅提供提示结构和外部生成工具链接。',
  sections: [
    {
      id: 'image-prompts',
      meta: 'IMAGE PROMPTS',
      title: '生图提示词',
      intro: '先写清主体与用途，再控制场景、构图、光线、材质和色彩。模型参数最后补充，不要用风格词掩盖需求。',
      template: '主体与动作 + 使用场景 + 构图与视角 + 光线与时间 + 材质与细节 + 色彩系统 + 画幅与留白 + 排除项',
      items: [
        {
          name: 'GPT Image 2 百例提示词',
          tag: '100 个案例',
          description: '覆盖手办、海报、商品图与参考图编辑等案例，适合按具体用途反查结构。',
          href: 'https://pan.quark.cn/s/d3886e571745?pwd=KK3k',
          code: 'KK3k',
          linkLabel: '打开资料',
        },
        {
          name: 'Nano Banana 生图提示词',
          tag: '案例资料',
          description: '面向 Nano Banana 系列模型的生图与图像编辑提示词资料。',
          href: 'https://pan.quark.cn/s/3376656fd654?pwd=8kpA',
          code: '8kpA',
          linkLabel: '打开资料',
        },
        {
          name: 'Midjourney V7 高级提示词',
          tag: '风格与构图',
          description: '适合视觉风格、镜头语言、材质与构图探索，也可作为其他生图模型参考。',
          href: 'https://pan.quark.cn/s/7de3e1caad09?pwd=TJC4',
          code: 'TJC4',
          linkLabel: '打开资料',
        },
        {
          name: 'Stable Diffusion 提示词大全',
          tag: '模型与参数',
          description: '面向 Stable Diffusion 的分类提示词表，也可酌情用于 Midjourney 等模型。',
          href: 'https://pan.quark.cn/s/8547d912c392',
          linkLabel: '打开资料',
        },
      ],
    },
    {
      id: 'video-prompts',
      meta: 'VIDEO PROMPTS',
      title: '视频提示词',
      intro: '视频提示词要描述时间变化：谁在什么环境中如何运动，摄影机怎样跟随，节奏和终止状态是什么。以下只放生成入口，不托管视频。',
      template: '主体初始状态 + 环境与时间 + 动作过程（起始→变化→结束） + 摄影机运动 + 景别与镜头 + 光线与氛围 + 时长与节奏 + 一致性约束 + 排除项',
      items: [
        { name: '即梦 AI', tag: '首尾帧 / 中文', description: '适合中文镜头描述、首尾帧控制和多参考素材的视频生成。', href: 'https://jimeng.jianying.com/', linkLabel: '前往生成' },
        { name: '可灵 AI', tag: '一致性 / 多镜头', description: '适合强调人物一致性、连续动作和多镜头叙事的提示词。', href: 'https://app.klingai.com/cn/', linkLabel: '前往生成' },
        { name: '通义万相', tag: '叙事 / 音画', description: '适合从参考图或文本组织连续叙事与镜头变化。', href: 'https://tongyi.aliyun.com/wanxiang/', linkLabel: '前往生成' },
        { name: 'Vidu', tag: '多参考', description: '适合用角色、物体和场景参考图约束视频的一致性。', href: 'https://www.vidu.com/', linkLabel: '前往生成' },
        { name: '海螺 AI', tag: '人物动作', description: '适合描述人物动作、表情变化和较明确的行为过程。', href: 'https://hailuoai.video/', linkLabel: '前往生成' },
        { name: 'PixVerse', tag: '短视频效果', description: '适合社交媒体短片、动作特效、口型与快速变换。', href: 'https://app.pixverse.ai/', linkLabel: '前往生成' },
        { name: 'Runway', tag: '镜头控制', description: '适合专业镜头语言、运动控制和后续编辑工作流。', href: 'https://runwayml.com/', linkLabel: '前往生成' },
        { name: 'Google Flow', tag: '场景构建', description: '适合把多个镜头放进同一场景和叙事结构中继续组织。', href: 'https://labs.google/fx/tools/flow', linkLabel: '前往生成' },
      ],
    },
  ],
};

function AiPromptsPage() {
  return <AiResourceGuide page={page} />;
}

export default AiPromptsPage;
