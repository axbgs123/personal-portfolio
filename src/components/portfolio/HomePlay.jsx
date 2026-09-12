/* Static text glyph positions are stable keys, not a reorderable list. */
/* eslint-disable react/no-array-index-key */
/* The focusable application region implements arrow-key game controls and Escape. */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
import { useEffect, useRef, useState } from 'react';
import styles from './homePlay.module.scss';

export function PlayTitle({ text, invertedIndices = [] }) {
  return (
    <span className={styles.playTitle} aria-label={text}>
      {[...text].map((letter, i) => (
        <span key={`${letter}-${i}`} aria-hidden="true" data-inverted={invertedIndices.includes(i) || undefined} style={{ '--letter': i }}>
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </span>
  );
}

export function OrbitDial() {
  const [turn, setTurn] = useState(0);
  const [pulse, setPulse] = useState(0);
  return (
    <button
      type="button"
      className={styles.dial}
      aria-label="拨动轨道，点击释放涟漪"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTurn((Math.atan2(e.clientY - rect.top - rect.height / 2, e.clientX - rect.left - rect.width / 2) * 180) / Math.PI);
      }}
      onClick={() => {
        setTurn((value) => value + 180);
        setPulse((value) => value + 1);
      }}
    >
      <span className={styles.disk} />
      <span className={styles.needle} style={{ transform: `rotate(${turn}deg)` }} />
      {pulse > 0 && (
        <span key={pulse} className={styles.ripples}>
          <i />
          <i />
          <i />
        </span>
      )}
      <small>拨动一下 ↗</small>
    </button>
  );
}

export function DodgeField() {
  const canvas = useRef(null);
  const root = useRef(null);
  const player = useRef({ x: 0.5, y: 0.5 });
  const elapsed = useRef(0);
  const [state, setState] = useState('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState('normal');
  const [power, setPower] = useState('');
  useEffect(() => {
    const element = canvas.current;
    const context = element.getContext('2d');
    let width = 800;
    let height = 170;
    let frame;
    let previous = performance.now();
    let spawn = 0;
    let seconds = 0;
    const pieces = [];
    const settings = { easy: [90, 0.8], normal: [125, 0.55], hard: [170, 0.36] }[difficulty];
    const pickups = [];
    let nextPickup = 3;
    let shield = false;
    let slowUntil = 0;
    let safeUntil = 0;
    let redraw = () => {};
    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = width * ratio;
      element.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      redraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const draw = (time) => {
      const dt = Math.min((time - previous) / 1000, 0.04);
      previous = time;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#111';
      for (let x = 20; x < width; x += 35)
        for (let y = 15; y < height; y += 35) {
          context.globalAlpha = 0.09;
          context.fillRect(x, y, 1, 1);
        }
      context.globalAlpha = 1;
      if (state === 'playing') {
        elapsed.current += dt;
        spawn += dt;
        if (spawn > Math.max(0.22, settings[1] - elapsed.current / 250)) {
          spawn = 0;
          pieces.push({ x: width + 15, y: Math.random() * (height - 26) + 13, speed: settings[0] + Math.min(elapsed.current * 3, 130), size: 6 + Math.random() * 7 });
        }
        if (elapsed.current >= nextPickup) {
          pickups.push({ x: width * 0.72, y: 25 + Math.random() * (height - 50), type: Math.random() < 0.5 ? 'shield' : 'slow', expires: elapsed.current + 7 });
          nextPickup = elapsed.current + 8;
        }
        if (slowUntil && elapsed.current >= slowUntil) {
          slowUntil = 0;
          setPower(shield ? '护盾就绪' : '');
        }
        pickups.forEach((item) => {
          item.x -= 22 * dt;
          context.strokeStyle = '#e14335';
          context.lineWidth = 1.5;
          context.beginPath();
          context.arc(item.x, item.y, 13, 0, Math.PI * 2);
          context.stroke();
          context.fillStyle = '#e14335';
          context.font = '14px sans-serif';
          context.textAlign = 'center';
          context.fillText(item.type === 'shield' ? '+' : 'Ⅱ', item.x, item.y + 5);
          if (Math.hypot(item.x - player.current.x * width, item.y - player.current.y * height) < 21) {
            if (item.type === 'shield') shield = true;
            else slowUntil = elapsed.current + 5;
            setPower(item.type === 'shield' ? '护盾就绪' : '减速 5 秒');
            item.expires = 0;
          }
        });
        for (let i = pickups.length - 1; i >= 0; i -= 1) if (pickups[i].expires < elapsed.current) pickups.splice(i, 1);
        pieces.forEach((p) => {
          p.x -= p.speed * dt * (slowUntil > elapsed.current ? 0.45 : 1);
          context.fillStyle = '#111';
          context.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          context.fillStyle = '#aaa';
          context.fillRect(p.x + p.size, p.y, 18, 1);
          if (Math.hypot(p.x - player.current.x * width, p.y - player.current.y * height) < p.size / 2 + 7) {
            if (elapsed.current < safeUntil) return;
            if (shield) {
              shield = false;
              safeUntil = elapsed.current + 1.2;
              p.x = -50;
              setPower('护盾抵挡了一次碰撞');
              return;
            }
            setScore(Math.floor(elapsed.current));
            setState('over');
          }
        });
        while (pieces[0]?.x < -30) pieces.shift();
        if (Math.floor(elapsed.current) !== seconds) {
          seconds = Math.floor(elapsed.current);
          setScore(seconds);
        }
      } else {
        [0.15, 0.35, 0.65, 0.85].forEach((x, i) => {
          context.strokeStyle = '#aaa';
          context.strokeRect(width * x, height * (0.25 + (i % 2) * 0.4), 12, 12);
        });
      }
      context.fillStyle = '#e14335';
      context.beginPath();
      context.arc(player.current.x * width, player.current.y * height, 6, 0, Math.PI * 2);
      context.fill();
      if (shield || elapsed.current < safeUntil) {
        context.strokeStyle = '#e14335';
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(player.current.x * width, player.current.y * height, 11, 0, Math.PI * 2);
        context.stroke();
      }
      if (state === 'playing') frame = requestAnimationFrame(draw);
    };
    draw(previous);
    redraw = () => {
      if (state !== 'playing') draw(performance.now());
    };
    const hidden = () => {
      if (document.hidden && state === 'playing') setState('idle');
    };
    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && state === 'playing') setState('idle');
    });
    visibility.observe(root.current);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [state, difficulty]);
  const start = () => {
    player.current = { x: 0.3, y: 0.5 };
    elapsed.current = 0;
    setScore(0);
    setPower('');
    setState('playing');
    root.current.focus({ preventScroll: true });
  };
  let label = '留一点空隙。';
  let action = '玩一下 ↗';
  if (state === 'playing') {
    label = `${score} 秒 · 躲开黑块`;
    action = '结束 ×';
  }
  if (state === 'over') {
    label = `坚持了 ${score} 秒`;
    action = '再来一次 ↗';
  }
  return (
    <div
      className={styles.game}
      ref={root}
      tabIndex={0}
      role="application"
      data-playing={state === 'playing'}
      aria-label="躲避飞行物小游戏，点击开始后用鼠标或方向键移动，Escape 退出"
      onPointerMove={(e) => {
        if (state !== 'playing') return;
        const rect = canvas.current.getBoundingClientRect();
        player.current = { x: Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)), y: Math.max(0.06, Math.min(0.94, (e.clientY - rect.top) / rect.height)) };
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setState('idle');
        if (state !== 'playing' || !e.key.startsWith('Arrow')) return;
        e.preventDefault();
        const vectors = { ArrowLeft: [-0.025, 0], ArrowRight: [0.025, 0], ArrowUp: [0, -0.07], ArrowDown: [0, 0.07] };
        const d = vectors[e.key];
        if (d) player.current = { x: Math.max(0.02, Math.min(0.98, player.current.x + d[0])), y: Math.max(0.06, Math.min(0.94, player.current.y + d[1])) };
      }}
    >
      <canvas ref={canvas} aria-hidden="true" />
      <div className={styles.gameTools}>
        <span>{label}</span>
        <select
          aria-label="小游戏难度"
          value={difficulty}
          disabled={state === 'playing'}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setState('idle');
            setPower('');
          }}
        >
          <option value="easy">轻松</option>
          <option value="normal">标准</option>
          <option value="hard">挑战</option>
        </select>
        <span aria-live="polite">{state === 'playing' ? power || '拾取 + 护盾 / Ⅱ 减速' : '+ 护盾 · Ⅱ 减速'}</span>
        <button type="button" onClick={state === 'playing' ? () => setState('idle') : start}>
          {action}
        </button>
      </div>
    </div>
  );
}
