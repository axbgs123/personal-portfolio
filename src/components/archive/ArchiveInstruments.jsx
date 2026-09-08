import PhotographyContact from './PhotographyContact';
import SkillAtlas from './SkillAtlas';
import AigcExhibition from './AigcExhibition';
import ProjectReel from './ProjectReel';
import styles from './archiveInstruments.module.scss';

export const instrumentCodes = ['PHOTOGRAPHY', 'PERSONAL SKILLS', 'AIGC', 'PROJECTS'];

export default function ArchiveInstruments({ code, entries = [], title }) {
  if (!entries.length)
    return (
      <section className={styles.instruments}>
        <p>还没有已整理的内容。</p>
      </section>
    );
  const components = { PHOTOGRAPHY: PhotographyContact, 'PERSONAL SKILLS': SkillAtlas, AIGC: AigcExhibition, PROJECTS: ProjectReel };
  const Exhibit = components[code];
  if (!Exhibit) return null;
  return (
    <section className={styles.instruments} aria-label={`${title}浏览`}>
      <Exhibit entries={entries} />
    </section>
  );
}
