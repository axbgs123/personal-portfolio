import NextHead from 'next/head';
import { NextSeo } from 'next-seo';
import PropTypes from 'prop-types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
const OG_IMAGE = `${SITE_URL}/og.png`;

const getSchema = () => ({
  '@context': 'http://schema.org',
  '@type': 'Person',
  name: '陈祉辰',
  jobTitle: 'AI 产品与内容实践者',
  url: SITE_URL,
  image: OG_IMAGE,
  email: 'mailto:2907107669@qq.com',
  sameAs: [],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: '泉州师范学院' },
    { '@type': 'Organization', name: '百言科技（杭州）有限公司' },
    { '@type': 'Organization', name: '福建赛牡丹数字科技有限公司' },
  ],
});

function CustomHead({ title = '', description, keywords }) {
  return (
    <>
      <NextHead>
        {/* General Meta Tags */}
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta httpEquiv="x-dns-prefetch-control" content="off" />
        <meta name="robots" content={process.env.NODE_ENV !== 'development' ? 'index,follow' : 'noindex,nofollow'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="keywords" content={keywords && keywords.length ? keywords.join(',') : keywords} />
        <meta name="author" content="陈祉辰" />
        <meta name="referrer" content="no-referrer" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="CN-ZJ" />

        {/* Canonical and Title */}
        <link rel="canonical" href={SITE_URL} />
        <title>{title}</title>

        {/* OpenGraph Meta Tags */}
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={SITE_URL} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/zc-mark.svg" />
        <meta name="msapplication-TileColor" content="#090909" />
        <meta name="theme-color" content="#f6f6f6" />

        {/* Schema */}
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchema()) }} />
      </NextHead>
      <NextSeo title={title} description={description} />
    </>
  );
}

CustomHead.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  keywords: PropTypes.arrayOf(PropTypes.string),
};

CustomHead.defaultProps = {
  keywords: [],
};

export default CustomHead;
