/* eslint-disable react/jsx-key */
const containt = [
  {
    smallTitle: '产品',
    bigTitle: '产品策划与交付',
    desc: [
      <div className="p-l">从用户问题和业务目标出发，将模糊需求拆成产品对象、流程、规则与验收标准。</div>,
      <div className="p-l">覆盖研究、原型、协作开发、测试验收到复盘沉淀的完整交付过程。</div>,
    ],
    descMobile: [
      <div className="p-l">从用户问题和业务目标出发，</div>,
      <div className="p-l">将模糊需求拆成产品对象、流程、规则与验收标准，</div>,
      <div className="p-l">覆盖从研究到复盘沉淀的完整交付过程。</div>,
    ],
    options: [
      { title: '用户访谈', desc: '围绕角色、场景、任务与阻碍提炼真实需求' },
      { title: '需求分析', desc: '区分目标、问题、约束和解决方案，确定优先级' },
      { title: '竞品研究', desc: '从产品结构与用户路径中识别机会和边界' },
      { title: '流程设计', desc: '把人、模型、数据与系统组织成完整业务路径' },
      { title: 'PRD 与原型', desc: '使用 Axure、墨刀与 Figma 描述产品行为' },
      { title: '协作开发', desc: '与开发共同确认接口、状态、异常和实现范围' },
      { title: '功能验收', desc: '以明确测试案例核对功能、数据和风险边界' },
      { title: '数据复盘', desc: '根据结果与反馈更新产品判断和后续计划' },
    ],
  },
  {
    smallTitle: '智能',
    bigTitle: 'AI 产品与工作流',
    desc: [<div className="p-l">围绕 Agent、Skill、RAG 与 MCP 设计可控的 AI 工作流，</div>, <div className="p-l">通过知识准备、确定性规则和人工审核降低模型不确定性。</div>],
    descMobile: [
      <div className="p-l">围绕 Agent、Skill、RAG 与 MCP</div>,
      <div className="p-l">设计可控的 AI 工作流，通过知识准备、</div>,
      <div className="p-l">确定性规则和人工审核降低模型不确定性。</div>,
    ],
    options: [
      { title: 'Agent 设计', desc: '定义目标、上下文、工具、计划与执行边界' },
      { title: 'Skill 设计', desc: '把岗位经验和验收规则封装为可复用能力' },
      { title: 'RAG 知识库', desc: '组织事实资料、检索策略和引用来源' },
      { title: 'Prompt 工程', desc: '围绕结构、示例、约束和评估迭代提示词' },
      { title: 'MCP 接入', desc: '让模型在明确权限下调用外部工具和数据' },
      { title: '模型选型', desc: '根据效果、速度、成本和场景选择模型' },
      { title: '人工审核', desc: '为关键任务设置批准、修改和回退节点' },
      { title: '质量规则', desc: '结合确定性检查与模型评审控制输出风险' },
    ],
  },
  {
    smallTitle: '内容',
    bigTitle: '内容增长与视觉表达',
    desc: [<div className="p-l">把内容研究、知识准备、生产审核、分发和效果回流组织成增长流程。</div>, <div className="p-l">结合摄影、视频与视觉设计经验，让产品信息更清楚，也更容易被理解。</div>],
    descMobile: [
      <div className="p-l">把内容研究、知识准备、生产审核、</div>,
      <div className="p-l">分发和效果回流组织成增长流程，</div>,
      <div className="p-l">并用视觉经验让产品信息更容易被理解。</div>,
    ],
    options: [
      {
        title: 'GEO 方法',
        desc: '围绕问题、事实、答案、分发与测量建立内容闭环',
      },
      { title: '内容资产', desc: '整理账号风格、事实资料和高表现素材' },
      { title: '多平台分发', desc: '设计发布确认、状态核验和结果记录流程' },
      {
        title: '视觉设计',
        desc: '使用 Photoshop 与 Blender 支持概念和界面表达',
      },
      { title: '视频制作', desc: '使用剪映与 After Effects 完成视频内容交付' },
      { title: '摄影摄像', desc: '将客户需求转化为创意方案并完成现场执行' },
    ],
  },
];

export default containt;
