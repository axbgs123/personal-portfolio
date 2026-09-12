import AiResourceGuide from '@src/pages/tutorials/components/AiResourceGuide';

const page = {
  title: 'AI 提示词',
  eyebrow: 'IMAGE · 精选资料',
  lead: '只留下能直接影响画面与镜头的提示结构。',
  description: '生图提示词资料。',
  keywords: ['AI 提示词', '生图提示词', 'Midjourney 提示词'],
  accent: '#e4e4e4',
  heroWords: ['SUBJECT', 'SCENE', 'LIGHT', 'CAMERA', 'MOTION', 'RHYTHM'],
  stats: [
    { value: '1', label: '提示词分类' },
    { value: '4', label: '生图资料入口' },
  ],
  note: '资料保留在原分享入口。',
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
          href: 'https://lcn2k35en4c5.feishu.cn/wiki/VEhQwRFG0iBBOkktOTtcwqdCnbf',
          linkLabel: '打开资料',
        },
        {
          name: 'Nano Banana 生图提示词',
          tag: '案例资料',
          description: '面向 Nano Banana 系列模型的生图与图像编辑提示词资料。',
          href: 'https://lcn2k35en4c5.feishu.cn/wiki/TYEVw1uPjiDedUkNtSmcOgtKnnf',
          linkLabel: '打开资料',
        },
        {
          name: 'Midjourney V7 高级提示词',
          tag: '风格与构图',
          description: '适合视觉风格、镜头语言、材质与构图探索，也可作为其他生图模型参考。',
          href: 'https://lcn2k35en4c5.feishu.cn/wiki/DZoqwhmwLipHF9k20wRc6AASnfb',
          linkLabel: '打开资料',
        },
        {
          name: 'Seedance 提示词',
          tag: '整理中',
          description: '',
          pending: true,
        },
      ],
    },
  ],
};

function AiPromptsPage() {
  return <AiResourceGuide page={page} />;
}

export default AiPromptsPage;
