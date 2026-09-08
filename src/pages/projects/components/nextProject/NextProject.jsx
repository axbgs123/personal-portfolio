import Image from 'next/image';
import Link from 'next/link';
import styles from './styles/nextProjectV2.module.scss';

function NextProject({ nextProject }) {
  return (
    <section className={styles.nextRoot} aria-label="继续查看项目">
      <Link href={nextProject.link} scroll={false} className={styles.card} aria-label={`下一个项目：${nextProject.title}`}>
        <div className={styles.copy}>
          <span>下一个项目 / {nextProject.date}</span>
          <h2>{nextProject.title}</h2>
          <span className={styles.action}>
            继续探索 <i aria-hidden="true">↗</i>
          </span>
        </div>
        <div className={styles.image}>
          <Image src={nextProject.img} fill sizes="(max-width: 760px) 100vw, 42vw" alt={nextProject.title} />
        </div>
      </Link>
    </section>
  );
}
export default NextProject;
