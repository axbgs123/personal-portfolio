import Head from 'next/head';
import ArchiveMachine from '@src/components/portfolio/ArchiveMachine';
import archiveWritingEntries from '@src/constants/archiveWritingEntries';

export default function WritingPage({ entries, storageId = 'writing' }) {
  return (
    <>
      <Head>
        <title>口播稿 · 陈祉辰</title>
        <meta name="description" content="陈祉辰的口播稿档案，包含 AI、科技与商业选题。拉动档案机发现一篇，也可以搜索直接阅读。" />
      </Head>
      <ArchiveMachine key={storageId} entries={entries} storageId={storageId} />
    </>
  );
}

export function getStaticProps() {
  return { props: { entries: archiveWritingEntries, storageId: 'writing' } };
}
