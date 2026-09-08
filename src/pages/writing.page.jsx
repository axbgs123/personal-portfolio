import Head from 'next/head';
import ArchiveMachine from '@src/components/portfolio/ArchiveMachine';
import archiveWritingEntries from '@src/constants/archiveWritingEntries';

export default function WritingPage({ entries, storageId = 'writing' }) {
  return (
    <>
      <Head>
        <title>文字与思考 · 陈祉辰</title>
        <meta name="description" content="陈祉辰的文章档案。拉动档案机发现一篇文章，也可以搜索直接阅读原文与配图。" />
      </Head>
      <ArchiveMachine key={storageId} entries={entries} storageId={storageId} />
    </>
  );
}

export function getStaticProps() {
  return { props: { entries: archiveWritingEntries, storageId: 'writing' } };
}
