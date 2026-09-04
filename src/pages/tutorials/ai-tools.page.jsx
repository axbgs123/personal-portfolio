import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import clsx from 'clsx';
import aiToolDocuments from '@src/constants/aiToolDocuments';
import styles from '@src/pages/tutorials/documentLibrary.module.scss';

function AiToolsPage() {
  return (
    <>
      <CustomHead title="Giats - AI 工具" description="C 哥 AI 资料库中的 11 份 AI 工具原始分类文档。" keywords={['AI 工具']} />
      <section className={clsx(styles.hero, 'layout-grid-inner')}>
        <div className={clsx(styles.breadcrumb, 'p-x')}>
          <Link scroll={false} href="/tutorials">
            教程
          </Link>
          <span>/</span>
          <span>AI 工具</span>
        </div>
        <div className={styles.heroCopy}>
          <div className={clsx(styles.eyebrow, 'p-l')}>原始资料 · 11 个分类</div>
          <h1 className={clsx(styles.title, 'h1')}>AI 工具</h1>
        </div>
      </section>
      <section className={clsx(styles.library, 'layout-block-inner')}>
        <div className={styles.libraryHeader}>
          <h2 className="h4">原始文件</h2>
          <span className="p-x">点击后在本站阅读</span>
        </div>
        <div className={styles.grid}>
          {aiToolDocuments.map((document, index) => (
            <Link className={styles.card} scroll={false} href={`/tutorials/ai-tools/${document.slug}`} key={document.slug}>
              <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
              <h2>{document.title}</h2>
              <span className={styles.open}>打开原文 ↗</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default AiToolsPage;
