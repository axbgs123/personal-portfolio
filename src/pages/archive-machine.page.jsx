import archiveWritingEntries from '@src/constants/archiveWritingEntries';
import WritingPage from './writing.page';

// Compatibility route for the original preview. It is now article-only as well.
export default WritingPage;

export function getStaticProps() {
  return { props: { entries: archiveWritingEntries, storageId: 'archive-machine' } };
}
