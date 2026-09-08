/* eslint-disable react/jsx-key */

const containt = [
  {
    smallTitle: '方法',
    bigTitle: 'AI 产品落地路径',
    desc: [<div className="p-l">从真实问题开始，以可运行、可审核、可复盘的流程结束。</div>, <div className="p-l">模型能力只是其中一环，产品需要同时处理数据、权限、异常与人的判断。</div>],
    descMobile: [<div className="p-l">从真实问题开始，以可运行、</div>, <div className="p-l">可审核、可复盘的流程结束，</div>, <div className="p-l">并同时处理数据、权限、异常与人的判断。</div>],
    options: [
      { title: '发现问题', desc: '通过访谈和业务观察确认真正需要解决的问题' },
      { title: '准备事实', desc: '整理数据、企业知识与可引用的业务资料' },
      { title: '设计流程', desc: '明确角色、状态、工具调用和人工决策节点' },
      { title: '搭建原型', desc: '用最小可行产品验证关键路径和模型效果' },
      { title: '协作实现', desc: '与开发确认接口、数据结构和异常处理方式' },
      { title: '质量评估', desc: '以规则、样例和测试集评估系统输出' },
      { title: '人工确认', desc: '对发布、写入等高影响动作保留审核权' },
      { title: '验收交付', desc: '依据清晰标准检查功能、内容与权限边界' },
      { title: '测量迭代', desc: '记录使用结果并更新知识、规则与产品方案' },
    ],
  },
  {
    smallTitle: '协作',
    bigTitle: '协作与交付',
    desc: [<div className="p-l">用文档、原型、测试案例和验收标准降低跨职能协作成本。</div>, <div className="p-l">让需求、实现范围、风险边界与交付结果始终能够被团队共同确认。</div>],
    descMobile: [
      <div className="p-l">用文档、原型、测试案例和验收标准</div>,
      <div className="p-l">降低跨职能协作成本，让需求、实现范围、</div>,
      <div className="p-l">风险边界与交付结果能够被共同确认。</div>,
    ],
    options: [
      { title: '项目启动', desc: '通过启动会议统一目标、范围与时间计划' },
      { title: '研究与规划', desc: '根据项目范围开展研究并制定开发策略' },
      { title: '方案评审', desc: '与业务、设计和开发共同检查产品方案' },
      { title: '任务拆解', desc: '把产品范围拆成可跟踪、可验收的交付任务' },
      {
        title: '规则共识',
        desc: '明确正常状态、异常状态和不可绕过的业务约束',
      },
      { title: '版本记录', desc: '保存需求、原型、规则与实现的关键变更' },
      { title: '能力复用', desc: '将通用知识和流程整理为模块、Agent 与 Skill' },
      {
        title: '跨职能协作',
        desc: '与开发、设计、运营和业务人员共同推进交付',
      },
      { title: '实现检查', desc: '对照需求和原型及时发现范围或行为偏差' },
      { title: '过程跟踪', desc: '持续更新进度、依赖、问题和下一步动作' },
      { title: '用户测试', desc: '开展用户测试，收集反馈并完成必要调整' },
      { title: '最终评审与确认', desc: '上线前完成最终评审并获得相关人员确认' },
      { title: '正式发布', desc: '在人工确认后发布，并核验数据和任务状态' },
      { title: '上线后复盘', desc: '根据使用反馈和业务结果持续调整产品' },
    ],
  },
];
export default containt;
