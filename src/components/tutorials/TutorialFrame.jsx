import CustomHead from '@src/components/dom/CustomHead';
import Link from 'next/link';
import { useId } from 'react';
import styles from './tutorialCollections.module.scss';

export default function TutorialFrame({ title, description, keywords = [], children, index = false, kind }) {
  return (
    <>
      <CustomHead title={`陈祉辰｜${title}`} description={description} keywords={keywords} />
      <div className={styles.page} data-tutorial-collection={kind}>
        <header className={styles.header}>
          <nav aria-label="当前位置">
            {index ? (
              <span>仓库</span>
            ) : (
              <Link scroll={false} href="/tutorials">
                教程
              </Link>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <div className={styles.heading}>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </header>
        {children}
      </div>
    </>
  );
}

export function CatalogSearch({ browser, label, countLabel }) {
  const inputId = useId();
  return (
    <div className={styles.searchBar}>
      <label htmlFor={inputId}>
        <span>{label}</span>
        <input ref={browser.search} id={inputId} type="search" value={browser.query} onChange={(event) => browser.filter(event.target.value)} placeholder="输入名称检索" />
      </label>
      <span role="status" aria-live="polite">
        {browser.filtered.length} {countLabel}
      </span>
      {browser.query && (
        <button type="button" onClick={browser.clear}>
          清除检索
        </button>
      )}
    </div>
  );
}

export function CatalogControls({ browser, previousLabel, nextLabel }) {
  return (
    <div className={styles.controls}>
      <button type="button" onClick={() => browser.select(browser.index - 1)} disabled={!browser.index} aria-label={previousLabel}>
        ←
      </button>
      <span>
        {browser.filtered.length ? browser.index + 1 : 0} / {browser.filtered.length}
      </span>
      <button type="button" onClick={() => browser.select(browser.index + 1)} disabled={browser.index >= browser.filtered.length - 1} aria-label={nextLabel}>
        →
      </button>
    </div>
  );
}

export function CatalogEmpty({ browser }) {
  return (
    <div className={styles.empty} role="status">
      <p>没有找到“{browser.query}”。</p>
      <button type="button" onClick={browser.clear}>
        清除关键词，查看全部资料 ↗
      </button>
    </div>
  );
}
