import { useEffect, useRef, useState } from 'react';
import styles from './ideaPlayground.module.scss';

const pieces = [
  { key: 'idea', label: '想法', x: 0.2, y: 0.3, angle: -12 },
  { key: 'spark', label: '灵感星', x: 0.49, y: 0.31, angle: 12 },
  { key: 'frame', label: '摄影取景框', x: 0.8, y: 0.28, angle: -7 },
  { key: 'type', label: '排版字母 Aa', x: 0.23, y: 0.74, angle: 8 },
  { key: 'ring', label: '一枚圆环', x: 0.52, y: 0.76, angle: -17 },
  { key: 'question', label: '一个问号', x: 0.82, y: 0.72, angle: 9 },
];

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

function PieceArtwork({ kind }) {
  if (kind === 'idea') return <span className={styles.ideaWord}>想法</span>;
  if (kind === 'spark') {
    return (
      <svg className={styles.sparkArt} viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <path d="m100 0 16 55 43-40-13 58 54-7-43 34 43 34-54-7 13 58-43-40-16 55-16-55-43 40 13-58-54 7 43-34L0 66l54 7-13-58 43 40Z" fill="currentColor" />
        <circle cx="100" cy="100" r="13" fill="#171718" />
      </svg>
    );
  }
  if (kind === 'frame') {
    return (
      <span className={styles.frameArt} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <span>看见</span>
        <b>+</b>
      </span>
    );
  }
  if (kind === 'type') return <span className={styles.typeArt}>Aa</span>;
  if (kind === 'ring') return <span className={styles.ringArt} aria-hidden="true" />;
  return <span className={styles.questionArt}>?</span>;
}

export default function IdeaPlayground({ id = 'playground' }) {
  const sectionRef = useRef(null);
  const boardRef = useRef(null);
  const pieceRefs = useRef([]);
  const engineRef = useRef(null);
  const [floating, setFloating] = useState(false);
  const [notice, setNotice] = useState('拖一拖，甩出去。也可以先失重一下。');

  useEffect(() => {
    const board = boardRef.current;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionPreference.matches;
    let width = 0;
    let height = 0;
    let visible = false;
    let isFloating = false;
    let frame = null;
    let lastFrame = 0;
    let tick;
    let activeDrag = null;
    let layer = 2;
    const bodies = pieces.map((piece, index) => ({ ...piece, node: pieceRefs.current[index], x: 0, y: 0, width: 0, height: 0, vx: 0, vy: 0, spin: 0, target: null, held: false }));

    const paint = (body) => {
      body.node.style.left = '0px';
      body.node.style.top = '0px';
      body.node.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.angle}deg)`;
    };

    const bounds = (body) => {
      const angle = (body.angle * Math.PI) / 180;
      const excessX = Math.max(0, (Math.abs(Math.cos(angle)) * body.width + Math.abs(Math.sin(angle)) * body.height - body.width) / 2);
      const excessY = Math.max(0, (Math.abs(Math.sin(angle)) * body.width + Math.abs(Math.cos(angle)) * body.height - body.height) / 2);
      return { left: 12 + excessX, right: width - body.width - 12 - excessX, top: 12 + excessY, bottom: height - body.height - 12 - excessY };
    };

    const home = (body, index) => {
      const edge = bounds({ ...body, angle: pieces[index].angle });
      const mobileX = index % 2 ? 0.76 : 0.25;
      const x = width < 500 ? mobileX : pieces[index].x;
      const y = width < 500 ? 0.18 + Math.floor(index / 2) * 0.32 : pieces[index].y;
      return { x: clamp(x * width - body.width / 2, edge.left, edge.right), y: clamp(y * height - body.height / 2, edge.top, edge.bottom), angle: pieces[index].angle };
    };

    const needsMotion = () => (isFloating && !reducedMotion) || bodies.some((body) => !body.held && (body.target || Math.abs(body.vx) + Math.abs(body.vy) + Math.abs(body.spin) > 0.5));

    const stopFrame = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastFrame = 0;
    };

    const wake = () => {
      if (frame === null && visible && !document.hidden && needsMotion()) frame = requestAnimationFrame(tick);
    };

    const bounceAtEdges = (body) => {
      const edge = bounds(body);
      if (body.x < edge.left || body.x > edge.right) {
        body.x = clamp(body.x, edge.left, edge.right);
        body.vx *= -0.78;
        body.spin *= -0.6;
      }
      if (body.y < edge.top || body.y > edge.bottom) {
        body.y = clamp(body.y, edge.top, edge.bottom);
        body.vy *= -0.78;
        body.spin *= -0.6;
      }
    };

    const collidePieces = () => {
      if (reducedMotion) return;
      bodies.forEach((first, firstIndex) => {
        bodies.slice(firstIndex + 1).forEach((second) => {
          if (first.target || second.target || (first.held && second.held)) return;
          const speed = Math.abs(first.vx) + Math.abs(first.vy) + Math.abs(second.vx) + Math.abs(second.vy);
          if (!isFloating && speed < 1) return;

          // Elliptical footprints approximate the mixed shapes without a physics dependency.
          const radiusX = (first.width + second.width) * 0.43;
          const radiusY = (first.height + second.height) * 0.43;
          const dx = second.x + second.width / 2 - first.x - first.width / 2;
          const dy = second.y + second.height / 2 - first.y - first.height / 2;
          const distance = Math.hypot(dx / radiusX, dy / radiusY);
          if (distance >= 1) return;

          const gradientX = dx / (radiusX * radiusX);
          const gradientY = dy / (radiusY * radiusY);
          const gradientLength = Math.hypot(gradientX, gradientY);
          const normalX = gradientLength > 0.000001 ? gradientX / gradientLength : 1;
          const normalY = gradientLength > 0.000001 ? gradientY / gradientLength : 0;
          const firstWeight = first.held ? 0 : 1;
          const secondWeight = second.held ? 0 : 1;
          const weight = firstWeight + secondWeight;
          const correction = ((1 - distance) * Math.min(radiusX, radiusY) * 0.78) / weight;
          first.x -= normalX * correction * firstWeight;
          first.y -= normalY * correction * firstWeight;
          second.x += normalX * correction * secondWeight;
          second.y += normalY * correction * secondWeight;

          const approach = (second.vx - first.vx) * normalX + (second.vy - first.vy) * normalY;
          if (approach >= 0) return;
          const impulse = (-1.72 * approach) / weight;
          first.vx -= normalX * impulse * firstWeight;
          first.vy -= normalY * impulse * firstWeight;
          second.vx += normalX * impulse * secondWeight;
          second.vy += normalY * impulse * secondWeight;
          const twist = clamp((normalX * (second.vy - first.vy) - normalY * (second.vx - first.vx)) * 0.025, -10, 10);
          first.spin -= twist * firstWeight;
          second.spin += twist * secondWeight;
        });
      });
    };

    tick = (time) => {
      frame = null;
      if (!visible || document.hidden) return;
      const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 0.034) : 1 / 60;
      lastFrame = time;

      bodies.forEach((body, index) => {
        if (body.held) return;
        if (body.target) {
          body.vx += ((body.target.x - body.x) * 65 - body.vx * 16) * dt;
          body.vy += ((body.target.y - body.y) * 65 - body.vy * 16) * dt;
          body.spin += ((body.target.angle - body.angle) * 65 - body.spin * 16) * dt;
          if (Math.abs(body.target.x - body.x) + Math.abs(body.target.y - body.y) + Math.abs(body.target.angle - body.angle) + Math.abs(body.vx) + Math.abs(body.vy) < 0.6) {
            Object.assign(body, body.target, { vx: 0, vy: 0, spin: 0, target: null });
          }
        } else if (isFloating && !reducedMotion) {
          body.vx += Math.sin(time / 1800 + index * 1.7) * 16 * dt;
          body.vy += Math.cos(time / 2200 + index * 2.3) * 14 * dt;
          body.vx *= 0.999;
          body.vy *= 0.999;
        } else {
          const friction = 0.91 ** (dt * 60);
          body.vx *= friction;
          body.vy *= friction;
          body.spin *= friction;
          if (Math.abs(body.vx) + Math.abs(body.vy) + Math.abs(body.spin) < 0.5) Object.assign(body, { vx: 0, vy: 0, spin: 0 });
        }

        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.angle += body.spin * dt;
        bounceAtEdges(body);
      });
      collidePieces();
      bodies.forEach((body) => {
        if (!body.held) bounceAtEdges(body);
        paint(body);
      });
      if (needsMotion()) wake();
      else lastFrame = 0;
    };

    const measure = () => {
      const previousWidth = width;
      const previousHeight = height;
      width = board.clientWidth;
      height = board.clientHeight;
      bodies.forEach((body, index) => {
        body.width = body.node.offsetWidth;
        body.height = body.node.offsetHeight;
        if (!previousWidth) Object.assign(body, home(body, index));
        else {
          const edge = bounds(body);
          body.x = clamp((body.x / previousWidth) * width, edge.left, edge.right);
          body.y = clamp((body.y / previousHeight) * height, edge.top, edge.bottom);
          if (body.target) body.target = home(body, index);
        }
        paint(body);
      });
    };

    const endDrag = (event, cancelled = false) => {
      if (!activeDrag || (event && event.pointerId !== activeDrag.pointerId)) return;
      const { body, pointerId, lastMove } = activeDrag;
      body.held = false;
      body.node.dataset.dragging = 'false';
      activeDrag = null;
      if (body.node.hasPointerCapture(pointerId)) body.node.releasePointerCapture(pointerId);
      if (cancelled || reducedMotion || performance.now() - lastMove > 110) Object.assign(body, { vx: 0, vy: 0, spin: 0 });
      wake();
    };

    engineRef.current = {
      startDrag(event, index) {
        if (event.button !== 0 || activeDrag) return;
        event.preventDefault();
        const body = bodies[index];
        Object.assign(body, { held: true, target: null, vx: 0, vy: 0, spin: 0 });
        layer += 1;
        body.node.style.zIndex = String(layer);
        body.node.dataset.dragging = 'true';
        body.node.focus({ preventScroll: true });
        body.node.setPointerCapture(event.pointerId);
        activeDrag = { body, pointerId: event.pointerId, pointerX: event.clientX, pointerY: event.clientY, lastMove: performance.now() };
      },
      moveDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
        event.preventDefault();
        const { body } = activeDrag;
        const now = performance.now();
        const dt = Math.max((now - activeDrag.lastMove) / 1000, 0.008);
        const dx = event.clientX - activeDrag.pointerX;
        const dy = event.clientY - activeDrag.pointerY;
        const edge = bounds(body);
        body.x = clamp(body.x + dx, edge.left, edge.right);
        body.y = clamp(body.y + dy, edge.top, edge.bottom);
        body.vx = clamp(dx / dt, -1150, 1150);
        body.vy = clamp(dy / dt, -1150, 1150);
        body.spin = clamp(body.vx * 0.045, -65, 65);
        Object.assign(activeDrag, { pointerX: event.clientX, pointerY: event.clientY, lastMove: now });
        paint(body);
      },
      endDrag,
      setFloating(value) {
        isFloating = value;
        if (value && !reducedMotion) {
          bodies.forEach((body, index) => {
            if (body.held) return;
            Object.assign(body, { target: null, vx: (index % 2 ? -1 : 1) * (32 + index * 7), vy: (index % 3 ? 1 : -1) * (28 + index * 4), spin: (index % 2 ? 1 : -1) * 8 });
          });
        }
        wake();
        return reducedMotion;
      },
      reset() {
        endDrag(null, true);
        isFloating = false;
        bodies.forEach((body, index) => {
          body.target = home(body, index);
          if (reducedMotion) Object.assign(body, body.target, { vx: 0, vy: 0, spin: 0, target: null });
          paint(body);
        });
        wake();
      },
      moveByKeyboard(event, index) {
        const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        const body = bodies[index];
        const distance = event.shiftKey ? 36 : 12;
        const edge = bounds(body);
        Object.assign(body, { target: null, vx: 0, vy: 0, spin: 0 });
        body.x = clamp(body.x + direction[0] * distance, edge.left, edge.right);
        body.y = clamp(body.y + direction[1] * distance, edge.top, edge.bottom);
        layer += 1;
        body.node.style.zIndex = String(layer);
        paint(body);
      },
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(board);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else {
          endDrag(null, true);
          stopFrame();
        }
      },
      { threshold: 0.08 },
    );
    intersection.observe(board);
    const onVisibility = () => {
      if (document.hidden) {
        endDrag(null, true);
        stopFrame();
      } else wake();
    };
    const onMotionPreference = (event) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        isFloating = false;
        setFloating(false);
        bodies.forEach((body) => Object.assign(body, { vx: 0, vy: 0, spin: 0, target: null }));
        stopFrame();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    motionPreference.addEventListener('change', onMotionPreference);

    return () => {
      stopFrame();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionPreference.removeEventListener('change', onMotionPreference);
      engineRef.current = null;
    };
  }, []);

  const toggleFloating = () => {
    const next = !floating;
    const reduced = engineRef.current?.setFloating(next);
    setFloating(next);
    if (reduced) setNotice('已尊重减少动态效果设置。仍然可以拖动，或用方向键移动。');
    else setNotice(next ? '现在，想法可以自由漂浮。抓住任何一个，继续玩。' : '失重结束，想法慢慢停下。');
  };

  const reset = () => {
    engineRef.current?.reset();
    setFloating(false);
    setNotice('重新排好了。下一次，可以更乱一点。');
  };

  return (
    <section ref={sectionRef} id={id} className={styles.playground} aria-labelledby={`${id}-title`}>
      <div className={styles.heading}>
        <span className={styles.eyebrow}>灵感游乐场 / JUST PLAY</span>
        <div className={styles.titleRow}>
          <h2 id={`${id}-title`}>
            暂时，
            <br />
            不讲效率<span>。</span>
          </h2>
          <div className={styles.intro}>
            <p>
              没有任务，也没有正确答案。
              <br />
              给想法一点自由活动的时间。
            </p>
            <span className={styles.handwritten} aria-hidden="true">
              ↙ 随便玩
            </span>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <p id={`${id}-instructions`}>
          拖拽 / 甩动 <span>·</span> 选中后用方向键移动，Shift 加快
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.floatButton} onClick={toggleFloating} aria-pressed={floating} data-magnetic>
            <span aria-hidden="true">{floating ? '↘' : '↗'}</span>
            {floating ? '回到地面' : '失重一下'}
          </button>
          <button type="button" className={styles.resetButton} onClick={reset} data-magnetic>
            <span aria-hidden="true">↻</span>重新排好
          </button>
        </div>
      </div>

      <div className={styles.board} ref={boardRef} role="group" aria-label="可拖拽的灵感桌面" aria-describedby={`${id}-instructions`}>
        <span className={styles.boardMark} aria-hidden="true">
          PLAY
        </span>
        {pieces.map((piece, index) => (
          <button
            key={piece.key}
            ref={(node) => {
              pieceRefs.current[index] = node;
            }}
            type="button"
            className={`${styles.piece} ${styles[piece.key]}`}
            style={{ left: `${piece.x * 100}%`, top: `${piece.y * 100}%`, transform: `translate(-50%, -50%) rotate(${piece.angle}deg)` }}
            aria-label={`${piece.label}，可拖动或用方向键移动`}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            aria-describedby={`${id}-instructions`}
            data-lenis-prevent
            data-cursor="拖动"
            onPointerDown={(event) => engineRef.current?.startDrag(event, index)}
            onPointerMove={(event) => engineRef.current?.moveDrag(event)}
            onPointerUp={(event) => engineRef.current?.endDrag(event)}
            onPointerCancel={(event) => engineRef.current?.endDrag(event, true)}
            onLostPointerCapture={(event) => engineRef.current?.endDrag(event, true)}
            onKeyDown={(event) => engineRef.current?.moveByKeyboard(event, index)}
          >
            <span className={styles.pieceInner} aria-hidden="true">
              <PieceArtwork kind={piece.key} />
            </span>
          </button>
        ))}
        <span className={styles.cornerNote} aria-hidden="true">
          有时候，灵感就是碰巧。
        </span>
      </div>

      <p className={styles.notice} role="status" aria-live="polite">
        {notice}
      </p>
    </section>
  );
}
