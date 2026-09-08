import FruitNinja from '@src/components/dom/prefooter/Index';
import clsx from 'clsx';
import styles from '@src/components/dom/styles/preFooter.module.scss';

function PreFooter() {
  return (
    <section className={clsx(styles.root, 'layout-block-inner')}>
      <div className={styles.textsContainer}>
        <div>
          <h2 className="h1">一起把 AI</h2>
          <h2 className="h1">做进真实</h2>
          <h2 className="h1">业务。</h2>
        </div>
        <div>
          <h6 className="h6">2027 届本科｜杭州｜开放 AI 产品经理与 AI 产品实习机会</h6>
        </div>
      </div>

      <div className={styles.canvas}>
        <FruitNinja />
      </div>
    </section>
  );
}

export default PreFooter;
