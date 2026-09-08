import Image from 'next/image';
import Link from 'next/link';
import TutorialFrame, { CatalogControls, CatalogEmpty, CatalogSearch } from './TutorialFrame';
import useTutorialBrowser from './useTutorialBrowser';
import styles from './tutorialCollections.module.scss';

export default function IllustratedProofTable({ tutorials }) {
  const browser = useTutorialBrowser(tutorials, 'x', 'cz-tutorial-illustrated');
  const tutorial = browser.active;
  return (
    <TutorialFrame title="图文教程" description="图文教程最终成品与配套文字。" keywords={['图文教程', 'AI 教程', 'Skill 教程']} kind="proof-table">
      <CatalogSearch browser={browser} label="检索图文教程" countLabel="组最终成品" />
      {tutorial ? (
        <>
          <div className={styles.proofStage}>
            <div className={styles.proofCopy}>
              <span className={styles.proofLabel}>最终成品 · 图片与文字</span>
              <h2>{tutorial.title}</h2>
              <p>{tutorial.imageCount} 张成品图</p>
              <Link scroll={false} href={`/tutorials/illustrated/${tutorial.slug}`} className={styles.proofOpen}>
                查看图文教程 <span aria-hidden="true">↗</span>
              </Link>
              <CatalogControls browser={browser} previousLabel="上一组图文教程" nextLabel="下一组图文教程" />
            </div>
            <Link scroll={false} href={`/tutorials/illustrated/${tutorial.slug}`} className={styles.proofImage} aria-label={`查看${tutorial.title}`}>
              <span className={styles.proofClamp} aria-hidden="true" />
              <Image src={tutorial.cover} alt={`${tutorial.title}最终版封面`} width={tutorial.width} height={tutorial.height} sizes="(max-width: 680px) 78vw, 36vw" priority />
              <span className={styles.proofCaption}>封面 / {tutorial.imageCount} 张</span>
            </Link>
          </div>
          <div className={styles.filmLabel}>
            <span>成品选集</span>
            <span>拖动或横向滚动 · 点击直达</span>
          </div>
          <div
            className={styles.filmStrip}
            ref={browser.rail}
            onScroll={browser.onScroll}
            onPointerDown={browser.dragProps.onPointerDown}
            onPointerMove={browser.dragProps.onPointerMove}
            onPointerUp={browser.dragProps.onPointerUp}
            onPointerCancel={browser.dragProps.onPointerCancel}
            onPointerLeave={browser.dragProps.onPointerLeave}
            onClickCapture={browser.dragProps.onClickCapture}
            onDragStartCapture={browser.dragProps.onDragStartCapture}
            data-lenis-prevent-horizontal
            aria-label="图文教程封面胶片"
          >
            {browser.filtered.map((item, index) => (
              <Link
                scroll={false}
                href={`/tutorials/illustrated/${item.slug}`}
                className={styles.filmFrame}
                key={item.slug}
                data-selected={index === browser.index}
                ref={(element) => {
                  browser.links.current[index] = element;
                }}
                onFocus={(event) => browser.focus(index, event)}
                onKeyDown={(event) => browser.key(event, index)}
                draggable={false}
              >
                <span className={styles.filmNumber}>
                  {String(index + 1).padStart(2, '0')} / {item.imageCount} 张
                </span>
                <Image src={item.cover} alt={`${item.title}最终版封面`} width={item.width} height={item.height} sizes="140px" draggable={false} />
                <span className={styles.filmTitle}>
                  {item.title}
                  <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <CatalogEmpty browser={browser} />
      )}
    </TutorialFrame>
  );
}
