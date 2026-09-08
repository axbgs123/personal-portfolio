import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './contentExhibits.module.scss';

export default function ImageInspection({ image, title }) {
  const [zoomed, setZoomed] = useState(false);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const frame = useRef(null);
  const id = useId();
  const point = (event) => {
    if (!zoomed || event.pointerType === 'touch') return;
    const rect = frame.current.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const nextY = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    setX(nextX);
    setY(nextY);
  };
  if (!image?.src) return null;
  return (
    <div className={styles.inspector} data-image-inspection>
      <button
        ref={frame}
        type="button"
        className={styles.inspectFrame}
        style={{ '--inspect-x': `${x}%`, '--inspect-y': `${y}%`, aspectRatio: `${image.width || 1672} / ${image.height || 941}` }}
        data-zoomed={zoomed}
        aria-label={`${zoomed ? '还原全图' : '放大检视'}：${title}`}
        aria-pressed={zoomed}
        aria-controls={`${id}-pan`}
        onClick={() => setZoomed((value) => !value)}
        onPointerMove={point}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setZoomed(false);
        }}
      >
        <Image src={image.src} alt={image.alt || title} fill sizes="(max-width: 760px) 90vw, 65vw" draggable={false} />
        <span className={styles.inspectLabel} aria-hidden="true">
          {zoomed ? '− 还原全图' : '＋ 放大检视'}
        </span>
      </button>
      <div id={`${id}-pan`} className={styles.panControls} hidden={!zoomed}>
        <p>用滑杆移动视角；桌面端也可以移动鼠标。</p>
        <label htmlFor={`${id}-x`}>
          左右
          <input id={`${id}-x`} type="range" min="0" max="100" value={Math.round(x)} onChange={(event) => setX(Number(event.target.value))} />
        </label>
        <label htmlFor={`${id}-y`}>
          上下
          <input id={`${id}-y`} type="range" min="0" max="100" value={Math.round(y)} onChange={(event) => setY(Number(event.target.value))} />
        </label>
      </div>
    </div>
  );
}
