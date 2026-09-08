import TutorialFrame from './TutorialFrame';
import styles from './tutorialCollections.module.scss';

export default function PromptDrawers({ page }) {
  return (
    <TutorialFrame title={page.title} description="生图资料与视频工具链接。" keywords={page.keywords} kind="prompt-drawers">
      <div className={styles.drawerCabinet}>
        {page.sections.map((section) => (
          <section className={styles.drawerSection} key={section.id} id={section.id} data-kind={section.id}>
            <div className={styles.drawerHeading}>
              <h2>{section.title}</h2>
              <p>{section.id === 'image-prompts' ? '站外资料 · 保留原分享链接与提取码' : '站外工具 · 本站不托管原视频'}</p>
            </div>
            <div className={styles.drawerItems}>
              {section.items.map((item) => (
                <a className={styles.materialDrawer} key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                  <span className={styles.drawerHandle} aria-hidden="true" />
                  <span className={styles.drawerTag}>{item.tag}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className={styles.drawerBottom}>
                    {item.code ? <span className={styles.code}>提取码：{item.code}</span> : <span>站外{section.id === 'image-prompts' ? '资料' : '工具'}</span>}
                    <span>{item.linkLabel || '打开资料'} ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </TutorialFrame>
  );
}
