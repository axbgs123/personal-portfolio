import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import aiToolDocuments from '@src/constants/aiToolDocuments';
import styles from '@src/pages/tutorials/documentLibrary.module.scss';

function AiToolDocumentPage({ document }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${document.title}`} description={`${document.title}原始资料。`} keywords={[document.title, 'AI 工具']} />
      <section className={styles.reader}>
        <div className={styles.readerBar}>
          <div>
            <Link scroll={false} href="/tutorials/ai-tools">
              ← AI 工具
            </Link>
            <h1>{document.title}</h1>
          </div>
          <a href={document.pdf} target="_blank" rel="noreferrer">
            单独打开原文件 ↗
          </a>
        </div>
        <iframe className={styles.pdfFrame} src={`${document.pdf}#view=FitH`} title={`${document.title}原始文件`} />
      </section>
    </>
  );
}

export function getStaticPaths() {
  return {
    paths: aiToolDocuments.map((document) => ({
      params: { slug: document.slug },
    })),
    fallback: false,
  };
}

export function getStaticProps({ params }) {
  return {
    props: {
      document: aiToolDocuments.find((item) => item.slug === params.slug),
    },
  };
}

export default AiToolDocumentPage;
