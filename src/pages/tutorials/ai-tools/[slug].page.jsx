/* eslint-disable react/no-array-index-key -- Source document blocks are immutable and never reordered. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Keyboard users need to focus the horizontally scrollable table region. */
import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import aiToolDocuments from '@src/constants/aiToolDocuments';
import styles from '@src/pages/tutorials/documentLibrary.module.scss';
import articleStyles from './toolArticle.module.scss';

function InlineText({ spans }) {
  return spans.map((span, index) => {
    const text = span.bold ? <strong>{span.text}</strong> : span.text;
    return span.href ? (
      <a key={index} href={span.href} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    ) : (
      <span key={index}>{text}</span>
    );
  });
}

function Block({ block }) {
  if (block.type === 'table') {
    return (
      <div className={articleStyles.tableScroll} tabIndex={0} role="region" aria-label="工具对照表，可横向滚动" data-lenis-prevent>
        <table>
          <thead>
            <tr>
              {block.rows[0].map((cell, index) => (
                <th scope="col" key={index}>
                  {cell.map((p, i) => (
                    <p key={i}>
                      <InlineText spans={p.spans} />
                    </p>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.slice(1).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    {cell.map((p, k) => (
                      <p key={k}>
                        <InlineText spans={p.spans} />
                      </p>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const Tag = block.type === 'heading' ? 'h2' : 'p';
  return (
    <Tag>
      <InlineText spans={block.spans} />
    </Tag>
  );
}

function AiToolDocumentPage({ document, blocks }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${document.title}`} description={`${document.title}的介绍与使用链接。`} keywords={[document.title, 'AI 工具']} />
      <section className={styles.reader}>
        <div className={styles.readerBar}>
          <div>
            <Link scroll={false} href="/tutorials/ai-tools">
              ← AI 工具
            </Link>
            <h1>{document.title}</h1>
          </div>
        </div>
        <article className={articleStyles.article}>
          {blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </article>
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

export async function getStaticProps({ params }) {
  const content = (await import('@src/content/ai-tools.json')).default;
  const document = aiToolDocuments.find((item) => item.slug === params.slug);
  const blocks = content[params.slug];
  const firstText = blocks[0]?.spans
    ?.map((span) => span.text)
    .join('')
    .replace(/\s/g, '');
  return {
    props: {
      document,
      blocks: firstText === document.title.replace(/\s/g, '') ? blocks.slice(1) : blocks,
    },
  };
}

export default AiToolDocumentPage;
