import FruitNinja from '@src/components/dom/prefooter/Index';
import clsx from 'clsx';
import styles from '@src/components/dom/styles/preFooter.module.scss';

function PreFooter() {
  return (
    <section className={clsx(styles.root, 'layout-block-inner')}>
      <div className={styles.textsContainer}>
        <div>
          <h2 className="h1">让我们一起</h2>
          <h2 className="h1">斩破你的下一个</h2>
          <h2 className="h1">挑战！</h2>
        </div>
        <div>
          <h6 className="h6">现在就与值得信赖的伙伴开启你的项目。</h6>
        </div>
      </div>

      <div className={styles.canvas}>
        <FruitNinja />
      </div>
    </section>
  );
}

export default PreFooter;
