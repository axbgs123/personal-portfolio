/* eslint-disable react/jsx-props-no-spreading */
import '@src/styles/global.scss';
import '@src/styles/global.css';
import '@src/components/portfolio/portfolioGlobal.scss';
import PortfolioShell from '@src/components/portfolio/PortfolioShell';

export default function App({ Component, pageProps, router }) {
  return (
    <PortfolioShell router={router}>
      <Component {...pageProps} />
    </PortfolioShell>
  );
}
