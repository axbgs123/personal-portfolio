import TutorialWorkbench from '@src/components/tutorials/TutorialWorkbench';
import archivePages from '@src/constants/archivePages';

export default function TutorialsPage() {
  return <TutorialWorkbench page={archivePages.tutorials} />;
}
