import { useEffect, useRef } from 'react';
import Router from 'next/router';
import gsap from 'gsap';
import styles from './creativePointer.module.scss';

export default function CreativePointer() {
  const pointer = useRef();
  const caption = useRef();
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const element = pointer.current;
      const x = gsap.quickTo(element, 'x', {
        duration: 0.22,
        ease: 'power3.out',
      });
      const y = gsap.quickTo(element, 'y', {
        duration: 0.22,
        ease: 'power3.out',
      });
      let magnetic;
      let magnetX;
      let magnetY;
      let lastTarget;
      let navigating = false;
      const resetMagnet = () => {
        if (magnetic)
          gsap.to(magnetic, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, .45)',
          });
        magnetic = null;
      };
      const move = (event) => {
        if (event.pointerType !== 'mouse' || navigating) return;
        x(event.clientX);
        y(event.clientY);
        element.dataset.visible = 'true';
        const target = event.target.closest?.('[data-cursor], a, button, summary, input, textarea');
        if (target !== lastTarget) {
          lastTarget = target;
          let text = target?.dataset.cursor || '';
          if (!text && target?.matches('a')) text = '打开 ↗';
          if (!text && target?.matches('summary')) text = '展开';
          if (target?.matches('a[href^="mailto:"]')) text = '聊聊';
          caption.current.textContent = text;
          element.dataset.mode = text ? 'label' : 'dot';
        }
        const candidate = event.target.closest?.('[data-magnetic]');
        if (candidate !== magnetic) {
          resetMagnet();
          magnetic = candidate;
          if (magnetic) {
            magnetX = gsap.quickTo(magnetic, 'x', {
              duration: 0.35,
              ease: 'power3.out',
            });
            magnetY = gsap.quickTo(magnetic, 'y', {
              duration: 0.35,
              ease: 'power3.out',
            });
          }
        }
        if (magnetic) {
          const bounds = magnetic.getBoundingClientRect();
          magnetX(Math.max(-10, Math.min(10, (event.clientX - bounds.left - bounds.width / 2) * 0.22)));
          magnetY(Math.max(-10, Math.min(10, (event.clientY - bounds.top - bounds.height / 2) * 0.22)));
        }
      };
      const leave = () => {
        element.dataset.visible = 'false';
        element.dataset.pressed = 'false';
        element.dataset.mode = 'dot';
        caption.current.textContent = '';
        lastTarget = null;
        resetMagnet();
      };
      const routeStart = () => {
        navigating = true;
        leave();
      };
      const routeEnd = () => {
        navigating = false;
        leave();
      };
      const press = () => {
        element.dataset.pressed = 'true';
      };
      const release = () => {
        element.dataset.pressed = 'false';
      };
      window.addEventListener('pointermove', move, { passive: true });
      document.addEventListener('mouseleave', leave);
      document.addEventListener('scroll', leave, true);
      window.addEventListener('blur', leave);
      window.addEventListener('pointerdown', press, { passive: true });
      window.addEventListener('pointerup', release, { passive: true });
      window.addEventListener('pointercancel', release, { passive: true });
      Router.events.on('routeChangeStart', routeStart);
      Router.events.on('routeChangeComplete', routeEnd);
      Router.events.on('routeChangeError', routeEnd);
      Router.events.on('hashChangeStart', leave);
      Router.events.on('hashChangeComplete', leave);
      window.addEventListener('portfolio:search-opened', leave);
      return () => {
        resetMagnet();
        window.removeEventListener('pointermove', move);
        document.removeEventListener('mouseleave', leave);
        document.removeEventListener('scroll', leave, true);
        window.removeEventListener('blur', leave);
        window.removeEventListener('pointerdown', press);
        window.removeEventListener('pointerup', release);
        window.removeEventListener('pointercancel', release);
        Router.events.off('routeChangeStart', routeStart);
        Router.events.off('routeChangeComplete', routeEnd);
        Router.events.off('routeChangeError', routeEnd);
        Router.events.off('hashChangeStart', leave);
        Router.events.off('hashChangeComplete', leave);
        window.removeEventListener('portfolio:search-opened', leave);
        x.tween.kill();
        y.tween.kill();
      };
    });
    return () => media.revert();
  }, []);
  return (
    <div ref={pointer} className={styles.pointer} aria-hidden="true">
      <span className={styles.disc}>
        <span ref={caption} />
      </span>
    </div>
  );
}
