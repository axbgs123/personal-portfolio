import Image from 'next/image';
import Link from 'next/link';
import navigateToReadingSection from '@src/pages/tutorials/components/navigateToReadingSection';
import styles from './migratedCaseStudy.module.scss';

// One family, different editorial rhythms: original evidence stays readable;
// short films form a screening wall, while the interview follows its six-step
// practice loop. Paper/ink foundations and shared cobalt highlight real actions.
// Existing media keeps its own aspect ratio. No imitation modal, invented cover,
// production claims, autoplay or HTML injection from the migrated source.
const prose = (value) =>
  String(value ?? '')
    .replace(/右侧/g, '正文')
    .replace(/左侧(?=集中展示|放入)/g, '下方')
    .replace(/左侧/g, '导读区')
    .replace(/按分组翻页查看/g, '按目录分组查看')
    .replace(/内容按项目分组翻页/g, '内容按项目分组呈现');
const slideId = (prefix, index) => `${prefix}-item-${index}`;
const slideTitle = (slide, index) => slide.label || slide.title || `资料 ${index + 1}`;
const cellKey = (row, column) => `${row[0]}:${column}`;
const isWebAddress = (value) => /^https?:\/\/[^\s]+$/i.test(value || '');
const isInterview = (study) => /SPEAKING COACH/i.test(study.type || '');

function Prose({ children }) {
  const text = prose(children);
  const matches = [...text.matchAll(/https?:\/\/[^\s<>\u3000-\u303f\uff00-\uffef\u4e00-\u9fff]+/gi)];
  const parts = [];
  let cursor = 0;
  matches.forEach((match) => {
    const href = match[0].replace(/[.,;!?)]+$/, '');
    if (!href || !isWebAddress(href)) return;
    parts.push(text.slice(cursor, match.index));
    parts.push(
      <a className={styles.inlineLink} href={href} target="_blank" rel="noopener noreferrer" key={`${match.index}:${href}`}>
        {href}
      </a>,
    );
    cursor = match.index + href.length;
  });
  parts.push(text.slice(cursor));
  return parts;
}

function Jump({ id, children }) {
  return (
    <a
      href={`#${id}`}
      onClick={(event) => {
        const disclosure = event.currentTarget?.ownerDocument?.getElementById(id)?.closest('details');
        if (disclosure) disclosure.open = true;
        navigateToReadingSection(event, id);
      }}
    >
      {children}
    </a>
  );
}

function Notes({ notes, prefix, count }) {
  if (!notes?.length) return null;
  return (
    <dl className={styles.notes}>
      {notes.map(([label, body, target]) => (
        <div key={label}>
          <dt>{Number.isInteger(target) && target >= 0 && target < count ? <Jump id={slideId(prefix, target)}>{label} ↘</Jump> : label}</dt>
          <dd>
            <Prose>{body}</Prose>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentSections({ sections = [] }) {
  return sections.map((section) => (
    <section className={styles.documentSection} key={section.title}>
      {section.title && <h4>{section.title}</h4>}
      {section.text && (
        <p>
          <Prose>{section.text}</Prose>
        </p>
      )}
      {section.items?.length > 0 && (
        <ul>
          {section.items.map((item) => (
            <li key={item}>
              <Prose>{item}</Prose>
            </li>
          ))}
        </ul>
      )}
      {section.rows?.length > 0 && (
        // A scrollable table needs a keyboard focus stop for native arrow scrolling.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={`${section.title || '资料'}表格`} data-lenis-prevent-horizontal>
          <table>
            <tbody>
              {section.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, columnIndex) =>
                    columnIndex === 0 ? (
                      <th scope="row" key={cellKey(row, columnIndex)}>
                        <Prose>{cell}</Prose>
                      </th>
                    ) : (
                      <td key={cellKey(row, columnIndex)}>
                        <Prose>{cell}</Prose>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  ));
}

function TextCard({ slide, nested }) {
  const Heading = nested ? 'h3' : 'h2';
  const external = slide.kind === 'link' && isWebAddress(slide.title);
  return (
    <>
      {slide.label && <span className={styles.label}>{slide.label}</span>}
      <Heading className={styles.sectionTitle}>{external ? '在线演示' : <Prose>{slide.title}</Prose>}</Heading>
      {slide.kind === 'notice' ? (
        <>
          <p className={styles.boundary}>这份原说明记录了开发环境的临时处理；正式部署应使用 HTTPS，不建议关闭浏览器安全保护。</p>
          <details className={styles.document}>
            <summary>
              {slide.button || '展开原部署说明'}
              <span aria-hidden="true">＋</span>
            </summary>
            <p className={styles.originalNotice}>{prose(slide.body)}</p>
          </details>
        </>
      ) : (
        <p className={styles.body}>
          <Prose>{slide.body}</Prose>
        </p>
      )}
      {external && (
        <p className={styles.external}>
          <a href={slide.title} target="_blank" rel="noopener noreferrer">
            {slide.title} ↗
          </a>
          <span>历史外链 · 当前可用性未验证</span>
        </p>
      )}
      {slide.kind === 'flow' && (
        <ol className={styles.flow}>
          {(slide.steps || []).map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h4>{step.title}</h4>
                <p>
                  <Prose>{step.text}</Prose>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {slide.kind === 'map' && (
        <div className={styles.branches}>
          {(slide.branches || []).map((branch) => (
            <section key={branch.title}>
              <h4>{branch.title}</h4>
              <ul>
                {(branch.items || []).map((item) => (
                  <li key={item}>
                    <Prose>{item}</Prose>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {slide.kind === 'doc' && (
        <details className={styles.document}>
          <summary>
            {slide.button || '展开原文档'}
            <span aria-hidden="true">＋</span>
          </summary>
          <DocumentSections sections={slide.sections} />
        </details>
      )}
    </>
  );
}

function Slide({ slide, index, prefix, nested = false, prototype = false, groupLead = false }) {
  const media = slide.type === 'image' || slide.type === 'video';
  const hasDimensions = slide.width > 0 && slide.height > 0;
  const landscape = hasDimensions ? slide.width >= slide.height : slide.landscape !== false;
  const fallbackRatio = landscape ? '16 / 9' : '9 / 16';
  return (
    <section
      className={`${styles.slide} ${media ? styles.mediaSlide : ''}`}
      id={slideId(prefix, index)}
      data-source-index={index}
      data-source-type={slide.type}
      data-card-kind={slide.kind}
      data-group-lead={groupLead}
    >
      {slide.type === 'card' ? (
        <TextCard slide={slide} nested={nested} />
      ) : (
        <figure className={styles.media}>
          {slide.type === 'image' && (
            <a href={slide.src} target="_blank" rel="noopener noreferrer" aria-label={`查看原图：${slide.caption || slide.label || '项目配图'}`}>
              <Image src={slide.src} alt={slide.caption || slide.label || '原项目配图'} width={slide.width || 1600} height={slide.height || 1000} sizes="(max-width: 820px) 92vw, 70vw" />
            </a>
          )}
          {slide.type === 'video' && (
            // Original videos have no separate caption tracks supplied; do not invent subtitles.
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={slide.src}
              poster={slide.poster}
              controls
              preload="none"
              playsInline
              onPlay={(event) => {
                const current = event.currentTarget;
                current
                  .closest('[data-screening]')
                  ?.querySelectorAll('video')
                  .forEach((video) => {
                    if (video !== current) video.pause();
                  });
              }}
              data-landscape={landscape}
              style={{ aspectRatio: hasDimensions ? `${slide.width} / ${slide.height}` : fallbackRatio }}
              aria-label={slide.label || '原项目视频'}
            />
          )}
          <figcaption>
            <span>{slide.caption || slide.label}</span>
            <a href={slide.src} target="_blank" rel="noopener noreferrer">
              {slide.type === 'video' ? '打开原视频' : '查看原图'} ↗
            </a>
          </figcaption>
          {prototype && slide.type === 'image' && <p className={styles.mediaNote}>早期演示与验证资料。界面中的 CTR、效率及其他数字为演示、估算或目标口径，不代表已上线成效。</p>}
        </figure>
      )}
    </section>
  );
}

function Contents({ study, prefix, nested = false }) {
  if (study.groups?.length)
    return study.groups.map((group, index) => (
      <li key={group.title}>
        <Jump id={`${prefix}-group-${index}`}>{group.title}</Jump>
      </li>
    ));
  return (study.slides || []).map((slide, index) => (
    <li key={slideId(prefix, index)} data-nested={nested}>
      <Jump id={slideId(prefix, index)}>{slideTitle(slide, index)}</Jump>
    </li>
  ));
}

function StudyContent({ study, prefix, nested = false, prototype = false }) {
  const slides = study.slides || [];
  if (!study.groups?.length)
    return (
      <div className={isInterview(study) ? styles.interviewContent : undefined}>
        {slides.map((slide, index) => (
          <Slide key={slideId(prefix, index)} slide={slide} index={index} prefix={prefix} nested={nested} prototype={prototype} />
        ))}
      </div>
    );
  const grouped = new Set();
  return (
    <>
      {study.groups.map((group, groupIndex) => {
        const page = study.pages?.[groupIndex];
        const [start, end] = group.range;
        const groupSlides = slides.slice(start, end);
        const firstImage = groupSlides.findIndex((slide) => slide.type === 'image');
        const shortDrama = /真人竖屏短剧/.test(group.title);
        const ipScreening = /AI 漫剧成片/.test(group.title);
        const screening = (shortDrama && 'drama') || (ipScreening && 'ip') || undefined;
        const introduction = page && (
          <div className={styles.pageIntroduction}>
            {page.title !== group.title && <h3>{page.title}</h3>}
            {page.desc !== group.desc && (
              <p>
                <Prose>{page.desc}</Prose>
              </p>
            )}
            <Notes notes={page.notes} prefix={prefix} count={slides.length} />
          </div>
        );
        const renderSlide = (slide, offset) => {
          const index = start + offset;
          grouped.add(index);
          return <Slide key={slideId(prefix, index)} slide={slide} index={index} prefix={prefix} nested prototype={prototype} groupLead={offset === firstImage} />;
        };
        return (
          <section className={styles.group} id={`${prefix}-group-${groupIndex}`} key={group.title} data-screening={screening}>
            <header className={styles.groupHeading}>
              <h2>{group.title}</h2>
              <p>
                <Prose>{group.desc}</Prose>
              </p>
            </header>
            {!ipScreening && introduction}
            <div className={styles.groupMedia} data-screening={screening}>
              {shortDrama ? (
                <>
                  <div className={styles.filmCovers}>{groupSlides.map((slide, offset) => (slide.type === 'image' ? renderSlide(slide, offset) : null))}</div>
                  <div className={styles.episodeStrip}>
                    <h3>成片放映</h3>
                    <div>{groupSlides.map((slide, offset) => (slide.type === 'video' && !/原素材/.test(slide.label) ? renderSlide(slide, offset) : null))}</div>
                  </div>
                  <details
                    className={styles.rawFootage}
                    onToggle={(event) => {
                      if (!event.currentTarget.open) event.currentTarget.querySelectorAll('video').forEach((video) => video.pause());
                    }}
                  >
                    <summary>
                      查看拍摄原素材<span aria-hidden="true">＋</span>
                    </summary>
                    <div>{groupSlides.map((slide, offset) => (slide.type === 'video' && /原素材/.test(slide.label) ? renderSlide(slide, offset) : null))}</div>
                  </details>
                </>
              ) : (
                groupSlides.map(renderSlide)
              )}
            </div>
            {ipScreening && introduction}
          </section>
        );
      })}
      {slides.map((slide, index) => (grouped.has(index) ? null : <Slide key={slideId(prefix, index)} slide={slide} index={index} prefix={prefix} nested prototype={prototype} />))}
    </>
  );
}

export default function MigratedCaseStudy({ study, title, parent = { title: '项目', href: '/more-projects' }, review }) {
  if (!study) return null;
  const demo = study.slides?.find((slide) => slide.kind === 'link' && isWebAddress(slide.title));
  return (
    <article className={styles.caseStudy} data-interview={isInterview(study)}>
      <header className={styles.hero}>
        <nav aria-label="当前位置">
          <Link href={parent.href} scroll={false}>
            {parent.title}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title || study.title}</span>
        </nav>
        <span className={styles.type}>{study.type}</span>
        <h1>{title || study.title}</h1>
        {title && title !== study.title && <p className={styles.sourceTitle}>原资料：{study.title}</p>}
        <p className={styles.lead}>
          <Prose>{study.desc}</Prose>
        </p>
        {demo && (
          <div className={styles.demoAction}>
            <a href={demo.title} target="_blank" rel="noopener noreferrer">
              打开项目演示 <span aria-hidden="true">↗</span>
            </a>
            <span>原演示地址 · 当前可用性未验证</span>
          </div>
        )}
        {review && <p className={styles.boundary}>未交付 MVP · 指标为目标或初步验证，不是线上成果。原复盘记录：因缺少达人素材授权，没有继续交付。</p>}
      </header>
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="案例内容导航">
          <span className={styles.tocLabel}>目录</span>
          <nav data-lenis-prevent>
            <ol>
              <li>
                <Jump id="case-overview">项目导读</Jump>
              </li>
              <Contents study={study} prefix="case" />
              {review && (
                <li className={styles.reviewNav}>
                  <Jump id="model-review">{review.title}</Jump>
                  <ol>
                    <Contents study={review} prefix="model-review" nested />
                  </ol>
                </li>
              )}
            </ol>
          </nav>
          <Link href={parent.href} scroll={false} className={styles.back}>
            ← {parent.title}
          </Link>
        </aside>
        <div className={styles.content}>
          <section className={styles.overview} id="case-overview">
            <h2>项目导读</h2>
            <Notes notes={study.notes} prefix="case" count={study.slides?.length || 0} />
          </section>
          <StudyContent study={study} prefix="case" prototype={Boolean(review)} />
          {review && (
            <section className={styles.review} id="model-review">
              <header className={styles.groupHeading}>
                <span className={styles.label}>项目内复盘</span>
                <h2>{review.title}</h2>
                <p>
                  <Prose>{review.desc}</Prose>
                </p>
              </header>
              <Notes notes={review.notes} prefix="model-review" count={review.slides?.length || 0} />
              <StudyContent study={review} prefix="model-review" nested prototype />
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
