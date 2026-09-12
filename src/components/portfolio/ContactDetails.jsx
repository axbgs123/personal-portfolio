import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './contactDetails.module.scss';

// The contact area is a quiet directory, not another modal. Phone and QR are
// copied from the supplied website; its scripts are not imported or executed.
// Keep the QR on opaque white and bypass image optimization/re-encoding.
export default function ContactDetails() {
  const [wechatOpen, setWechatOpen] = useState(false);
  const trigger = useRef(null);
  const id = useId();
  const panelId = `${id}-wechat-contact`;

  const close = () => {
    setWechatOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const handleEscape = (event) => {
    if (event.key !== 'Escape' || !wechatOpen) return;
    event.preventDefault();
    close();
  };

  return (
    <div className={styles.details} data-contact-details>
      <p className={styles.practice}>AI 产品实践 · 内容工作流 · 视觉创作</p>
      <div className={styles.channels}>
        <a className={styles.channel} href="mailto:2907107669@qq.com" onKeyDown={handleEscape}>
          <span className={styles.label}>邮箱</span>
          <span className={styles.value}>2907107669@qq.com</span>
        </a>
        <a className={styles.channel} href="tel:13157682817" onKeyDown={handleEscape}>
          <span className={styles.label}>电话</span>
          <span className={styles.value}>13157682817</span>
        </a>
        <div className={styles.wechat}>
          <button
            ref={trigger}
            className={styles.wechatTrigger}
            type="button"
            aria-expanded={wechatOpen}
            aria-controls={panelId}
            onClick={() => setWechatOpen((value) => !value)}
            onKeyDown={handleEscape}
          >
            <span className={styles.label}>微信</span>
            <span className={styles.value}>
              {wechatOpen ? '收起二维码' : '展开二维码'}
              <span className={styles.mark} aria-hidden="true">
                {wechatOpen ? '−' : '＋'}
              </span>
            </span>
          </button>
          <div id={panelId} className={styles.wechatPanel} role="region" aria-label="微信联系二维码" hidden={!wechatOpen}>
            <div className={styles.qrPaper}>
              <Image className={styles.qrImage} src="/contact/wechat-qr.webp" alt="微信联系二维码" width={735} height={750} unoptimized />
            </div>
            <div className={styles.qrCaption}>
              <span>微信扫一扫</span>
              <button type="button" onClick={close} onKeyDown={handleEscape}>
                收起
              </button>
            </div>
            <a className={styles.original} href="/contact/wechat-qr.webp" target="_blank" rel="noopener noreferrer" onKeyDown={handleEscape}>
              打开二维码原图<span aria-hidden="true"> ↗</span>
              <span className={styles.srOnly}>，在新窗口打开</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
