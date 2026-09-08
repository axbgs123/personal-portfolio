import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import SignatureMark from '@src/components/portfolio/SignatureMark';
import profilePortrait from '@src/constants/profilePortrait';
import projects from '@src/constants/projects';
import writingArticles from '@src/constants/writingArticles';
import styles from './designLab.module.scss';

/*
 * Isolated palette experiment — not a new homepage or archive proposal.
 * Subject: Chen Zhichen's AI product/content practice. Job: compare color only.
 * Tokens: paper #F6F6F6, ink #090909, secondary #686868, plane #E8E8E8,
 * line #CDCDCD, optional accent #D74436. Accent is never small body text.
 * Type: existing Portfolio Haas display, PingFang body, SFMono utility.
 * Layout: existing centered 960px name/portrait composition, then real links.
 * Signature: one small red punctuation mark answers the existing ZC geometry.
 * Critique: a red full-bleed hero would compare different visual hierarchies;
 * reject it. Both schemes use identical DOM, geometry, images, and type.
 * Motion: 180ms color response, small link-arrow shifts, opt-in silent bars.
 * No autoplay, new scroll hooks, global CSS, stored preference, or fake metrics.
 */
export default function DesignLab({ featuredProjects, readings }) {
  const [palette, setPalette] = useState('mono');
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <Head>
        <title>配色对照 · 陈祉辰</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="黑白与朱红点缀的独立配色对照。保留相同构图，不影响现有首页。" />
      </Head>
      <div className={styles.lab} data-design-lab data-palette={palette}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLabel}>
            <span>配色对照</span>
            <small>同一构图，只切换点缀色</small>
          </div>
          <fieldset className={styles.switcher}>
            <legend className={styles.srOnly}>选择对照配色</legend>
            <label htmlFor="lab-palette-mono">
              <input id="lab-palette-mono" type="radio" name="design-lab-palette" value="mono" checked={palette === 'mono'} onChange={() => setPalette('mono')} />
              <span>
                <i className={styles.monoSwatch} aria-hidden="true" />
                黑白
              </span>
            </label>
            <label htmlFor="lab-palette-vermilion">
              <input id="lab-palette-vermilion" type="radio" name="design-lab-palette" value="vermilion" checked={palette === 'vermilion'} onChange={() => setPalette('vermilion')} />
              <span>
                <i className={styles.redSwatch} aria-hidden="true" />
                朱红点缀
              </span>
            </label>
          </fieldset>
          <span className={styles.srOnly} role="status">
            {palette === 'mono' ? '已切换为黑白配色' : '已切换为朱红点缀，正文仍保持黑白灰'}
          </span>
        </div>

        <section className={styles.hero} aria-labelledby="lab-hero-title">
          <div className={styles.atmosphere} aria-hidden="true">
            <div className={styles.plane} />
          </div>
          <div className={styles.composition}>
            <div className={styles.identity}>
              <h1 className={styles.title} id="lab-hero-title" aria-label="陈祉辰，AI 产品、内容与创作">
                <span className={styles.chineseName}>
                  陈祉辰<span aria-hidden="true"> / </span>
                </span>
                <span className={styles.nameWord} aria-hidden="true">
                  CHEN
                </span>
                <span className={`${styles.nameWord} ${styles.givenName}`} aria-hidden="true">
                  ZHICHEN<span className={styles.namePeriod}>.</span>
                </span>
              </h1>
              <p className={styles.introduction}>
                把 AI 带进真实工作，
                <br />
                也把实践变成值得分享的内容。
              </p>
              <div className={styles.selectedLinks}>
                <Link href="/projects/project1" scroll={false}>
                  AI 运营平台<span aria-hidden="true">↗</span>
                </Link>
                <Link href="/projects/project2" scroll={false}>
                  GEO 内容增长<span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
            <figure className={styles.portrait}>
              <Image src={profilePortrait.src} alt={profilePortrait.alt} fill priority sizes="(max-width: 760px) 80vw, 440px" style={{ objectPosition: profilePortrait.position }} />
            </figure>
          </div>
          <div className={styles.heroFooter}>
            <Link className={styles.workLink} href="/#work" scroll={false}>
              查看作品<span aria-hidden="true">↘</span>
            </Link>
            <Link className={styles.pianoLink} href="/#playground" scroll={false}>
              试弹钢琴<span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        <section className={styles.workSamples} aria-labelledby="lab-project-title">
          <div className={styles.sectionHeading}>
            <h2 id="lab-project-title">项目入口</h2>
            <span>原站真实项目</span>
          </div>
          <div className={styles.projectGrid}>
            {featuredProjects.map((project) => (
              <Link key={project.id} className={styles.project} href={project.link} scroll={false}>
                <div className={styles.projectImage}>
                  <Image src={project.img} alt={project.title} fill sizes="(max-width: 760px) 90vw, 460px" />
                </div>
                <h3>
                  {project.title}
                  <span aria-hidden="true">↗</span>
                </h3>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.inkSamples} aria-labelledby="lab-reading-title">
          <div className={styles.inkInner}>
            <div className={styles.reading}>
              <div className={styles.sectionHeading}>
                <h2 id="lab-reading-title">文字与思考</h2>
                <span>阅读链接</span>
              </div>
              {readings.map((article) => (
                <Link key={article.slug} className={styles.readingLink} href={`/writing/${article.slug}`} scroll={false}>
                  <span>{article.title}</span>
                  <span className={styles.readingArrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
            <div className={styles.motionSample}>
              <SignatureMark className={styles.signature} />
              <div className={styles.motionControl}>
                <div className={styles.equalizer} data-playing={playing} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <button type="button" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}>
                  {playing ? '停止播放指示' : '预览播放指示'}
                </button>
              </div>
              <p>
                仅动效，无声音。
                <Link href="/#playground" scroll={false}>
                  前往钢琴
                </Link>
              </p>
            </div>
          </div>
        </section>
        <div className={styles.labFoot}>
          <span>保留两种配色供对照，朱红点缀已用于新版网站。</span>
          <Link href="/" scroll={false}>
            返回新版首页<span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export function getStaticProps() {
  return {
    props: {
      featuredProjects: ['project1', 'project2'].map((id) => {
        const project = projects.find((entry) => entry.id === id);
        return {
          id: project.id,
          title: project.title,
          img: project.img,
          link: project.link,
        };
      }),
      readings: ['fde-four-capabilities', 'doubao-phone-rush'].map((slug) => {
        const article = writingArticles.find((entry) => entry.slug === slug);
        return { slug: article.slug, title: article.title };
      }),
    },
  };
}
