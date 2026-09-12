import TutorialFrame from './TutorialFrame';
import styles from './tutorialCollections.module.scss';

export default function PromptDrawers({ page }) {
  return (
    <TutorialFrame title={page.title} description="生图提示词资料。" keywords={page.keywords} kind="prompt-drawers">
      <div className={styles.drawerCabinet}>
        {page.sections.map((section) => (
          <section className={styles.drawerSection} key={section.id} id={section.id} data-kind={section.id}>
            <div className={styles.drawerHeading}>
              <p>飞书资料 · 点击打开</p>
            </div>
            <div className={styles.drawerItems}>
              {section.items.map((item) => {
                const Card = item.pending ? 'div' : 'a';
                return (
                  <Card
                    className={styles.materialDrawer}
                    key={item.name}
                    aria-disabled={item.pending || undefined}
                    href={item.href}
                    target={item.pending ? undefined : '_blank'}
                    rel={item.pending ? undefined : 'noopener noreferrer'}
                  >
                    <span className={styles.drawerHandle} aria-hidden="true" />
                    <span className={styles.drawerTag}>{item.tag}</span>
                    <h3>{item.name}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className={styles.drawerBottom}>
                      <span>{item.pending ? '整理中' : '飞书资料'}</span>
                      {!item.pending && <span>{item.linkLabel || '打开资料'} ↗</span>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </TutorialFrame>
  );
}
