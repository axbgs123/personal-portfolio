import AppearTitle from '@src/components/animationComponents/appearTitle/Index';
import clsx from 'clsx';
import styles from '@src/pages/about/components/overview/styles/overview.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';

function Overview() {
  const isMobile = useIsMobile();

  return (
    <section className={clsx(styles.root, 'layout-grid-inner')}>
      <div className={styles.title}>
        {isMobile ? (
          <AppearTitle key="mobile-queto">
            <h3 className="h3">AI 产品经理的工作，</h3>
            <h3 className="h3">不是罗列模型能力，</h3>
            <h3 className="h3">
              而是把<span className="medium">不确定性</span>组织成
            </h3>
            <h3 className="h3">
              <span className="medium">可执行</span>、可审核的流程。
            </h3>
          </AppearTitle>
        ) : (
          <AppearTitle key="desktop-queto">
            <h3 className="h3">AI 产品经理的工作，不是罗列模型能力，</h3>
            <h3 className="h3">
              而是把<span className="medium">不确定性</span>组织成
            </h3>
            <h3 className="h3">
              <span className="medium">可执行</span>、可审核、可迭代的流程。
            </h3>
          </AppearTitle>
        )}
      </div>
      <div className={clsx(styles.text, 'p-l', styles.myStory)}>
        <AppearTitle>
          <span>关于我的几句话</span>
        </AppearTitle>
      </div>
      <div className={styles.desc}>
        {!isMobile ? (
          <AppearTitle key="desktop-overview">
            <h6 className="h6">你好，我是陈祉辰，泉州师范学院数字媒体技术专业本科生，</h6>
            <h6 className="h6">目前在杭州寻找 AI 产品经理与 AI 产品实习机会。</h6>
            <h6 className="h6">我的实践横跨产品策划、AI 工作流、内容运营与视觉创作，</h6>
            <h6 className="h6">这让我能同时理解用户、业务、模型与交付之间的关系。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>在百言科技与赛牡丹数字科技实习期间，</h6>
            <h6 className="h6">我参与需求调研、产品规划、知识库与 Agent 设计、</h6>
            <h6 className="h6">协作开发、功能验收，以及课程和内容资产建设。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>我更在意 AI 能否进入真实流程，</h6>
            <h6 className="h6">形成可交付、可复用、可验证的业务结果。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>陈祉辰。</h6>
          </AppearTitle>
        ) : (
          <AppearTitle key="mobile-overview">
            <h6 className="h6">你好，我是陈祉辰，泉州师范学院</h6>
            <h6 className="h6">数字媒体技术专业本科生。</h6>
            <h6 className="h6">目前在杭州寻找 AI 产品经理与 AI 产品实习机会。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>我的实践横跨产品策划、AI 工作流、</h6>
            <h6 className="h6">内容运营与视觉创作。</h6>
            <h6 className="h6">我参与过需求调研、产品规划、知识库与 Agent 设计、</h6>
            <h6 className="h6">协作开发、功能验收和内容资产建设。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>我更在意 AI 能否进入真实流程，</h6>
            <h6 className="h6">形成可交付、可复用、可验证的业务结果。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>陈祉辰。</h6>
          </AppearTitle>
        )}
      </div>
    </section>
  );
}
export default Overview;
