// Paused after user feedback: this is a creation tool, not a content exhibit.
// Kept outside src/pages so the production site does not expose this route.
import Head from 'next/head';
import TypePlay from '@src/components/type-play/TypePlay';

export default function TypePlayPage() {
  return (
    <>
      <Head>
        <title>字由 · 实时排版实验</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="写一句话，拉动文字，定格成自己的黑白海报。独立交互小样。" />
      </Head>
      <TypePlay />
    </>
  );
}

TypePlayPage.standalone = true;
