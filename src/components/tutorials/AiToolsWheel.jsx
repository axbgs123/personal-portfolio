import Link from 'next/link';
import TutorialFrame, { CatalogControls, CatalogEmpty, CatalogSearch } from './TutorialFrame';
import useTutorialBrowser from './useTutorialBrowser';
import styles from './tutorialCollections.module.scss';

export default function AiToolsWheel({ documents }) {
  const browser = useTutorialBrowser(documents, 'y', 'cz-tutorial-tools');
  const document = browser.active;
  return (
    <TutorialFrame title="AI 工具" description="AI 工具分类资料与实践指南。" keywords={['AI 工具']} kind="tool-wheel">
      <CatalogSearch browser={browser} label="检索工具分类" countLabel="份原始 PDF" />
      {document ? (
        <div className={styles.toolStation}>
          <div className={styles.wheelHousing}>
            <div className={styles.wheelLabel}>
              <span>分类选择</span>
              <span>滚动 / ↑ ↓</span>
            </div>
            <div className={styles.wheelWindow}>
              <div className={styles.wheelSelection} aria-hidden="true" />
              <div className={styles.toolWheel} ref={browser.rail} onScroll={browser.onScroll} data-lenis-prevent aria-label="AI 工具原始资料目录">
                {browser.filtered.map((item, index) => (
                  <Link
                    scroll={false}
                    href={`/tutorials/ai-tools/${item.slug}`}
                    key={item.slug}
                    ref={(element) => {
                      browser.links.current[index] = element;
                    }}
                    className={styles.wheelItem}
                    data-selected={index === browser.index}
                    style={{
                      '--wheel-distance': Math.min(3, Math.abs(index - browser.index)),
                    }}
                    onFocus={(event) => browser.focus(index, event)}
                    onKeyDown={(event) => browser.key(event, index)}
                  >
                    <span>{item.title}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </div>
            <CatalogControls browser={browser} previousLabel="上一类工具" nextLabel="下一类工具" />
          </div>
          <div className={styles.toolOutput}>
            <div className={styles.outputSlot} aria-hidden="true" />
            <Link scroll={false} className={styles.pdfSheet} href={`/tutorials/ai-tools/${document.slug}`} key={document.slug}>
              <span className={styles.fileType}>
                PDF<span>原始资料</span>
              </span>
              <h2>{document.title}</h2>
              <span className={styles.sheetRules} aria-hidden="true" />
              <span className={styles.sheetLink}>在本站阅读原文 ↗</span>
            </Link>
            <a className={styles.originalLink} href={document.pdf} target="_blank" rel="noopener noreferrer">
              单独打开原文件 ↗
            </a>
          </div>
        </div>
      ) : (
        <CatalogEmpty browser={browser} />
      )}
    </TutorialFrame>
  );
}
