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
            <h3 className="h3">前端开发者的角色，</h3>
            <h3 className="h3">
              就像一位体贴的主人，<span className="medium">确保</span>
            </h3>
            <h3 className="h3">
              每位访客都能获得<span className="medium">流畅</span>且
            </h3>
            <h3 className="h3">
              <span className="medium">愉悦</span>的体验。
            </h3>
          </AppearTitle>
        ) : (
          <AppearTitle key="desktop-queto">
            <h3 className="h3">前端开发者就像一位体贴的主人，</h3>
            <h3 className="h3">
              <span className="medium">确保</span>每位访客都能获得
            </h3>
            <h3 className="h3">
              <span className="medium">流畅</span>且<span className="medium">愉悦</span>的体验。
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
            <h6 className="h6">你好！我是一名来自希腊的 26 岁前端开发者，</h6>
            <h6 className="h6">热衷于打造令人惊喜的数字体验。我学习了软件工程，</h6>
            <h6 className="h6">不断加深对产品构建方式的理解，希望做出简洁、</h6>
            <h6 className="h6">高效的网站与应用。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>不写代码时，我常从设计世界中寻找灵感。</h6>
            <h6 className="h6">无论是探索新的色彩组合，还是打磨用户界面，</h6>
            <h6 className="h6">我都喜欢把创意融入自己的作品。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>工作之外，我也喜欢保持活力：游泳、划船，</h6>
            <h6 className="h6">或玩几局紧张刺激的电脑游戏，让自己放松充电。</h6>

            <h6 className={clsx(styles.paddingTop, 'h6')}>期待与你合作，一起创造真正出色的作品！</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>埃万杰洛斯·贾齐迪斯。</h6>
          </AppearTitle>
        ) : (
          <AppearTitle key="mobile-overview">
            <h6 className="h6">你好！我是一名来自希腊的 26 岁前端开发者，</h6>
            <h6 className="h6">热衷于打造令人惊喜的数字体验。我学习了软件工程，</h6>
            <h6 className="h6">不断加深对产品构建方式的理解，希望做出</h6>
            <h6 className="h6">简洁、高效的网站与应用。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>不写代码时，我常从设计世界中寻找灵感。</h6>
            <h6 className="h6">无论是探索新的色彩组合，还是打磨用户界面，</h6>
            <h6 className="h6">我都喜欢把创意融入</h6>
            <h6 className="h6">自己的作品。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>工作之外，我也喜欢保持活力：</h6>
            <h6 className="h6">游泳、划船，或玩几局紧张刺激的电脑游戏，</h6>
            <h6 className="h6">让自己放松充电。</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>期待与你合作，一起创造</h6>
            <h6 className="h6">真正出色的作品！</h6>
            <h6 className={clsx(styles.paddingTop, 'h6')}>埃万杰洛斯·贾齐迪斯。</h6>
          </AppearTitle>
        )}
      </div>
    </section>
  );
}
export default Overview;
