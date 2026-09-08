import { useCallback, useEffect, useId, useRef, useState } from 'react';
import SignatureMark from '@src/components/portfolio/SignatureMark';
import { createWorld, grabBody, hitTest, isWorldAtRest, moveGrab, nudgeBody, releaseGrab, settleWorld, stepWorld } from '@src/lib/typePlayPhysics.mjs';
import { createGlyphMetrics, renderPoster, segmentPhrase } from '@src/lib/typePlayPoster.mjs';
import styles from './typePlay.module.scss';

const INITIAL_PHRASE = '把想法放出来';
const WIDTH = 1000;
const HEIGHT = 1100;

export default function TypePlay() {
  const fieldId = useId();
  const canvasRef = useRef(null);
  const worldRef = useRef(null);
  const frameRef = useRef(null);
  const previousTime = useRef(0);
  const dragRef = useRef(null);
  const stateRef = useRef({ frozen: false, linked: true, gravity: false, inverted: false, selectedId: null, phrase: INITIAL_PHRASE });
  const [input, setInput] = useState(INITIAL_PHRASE);
  const [phrase, setPhrase] = useState(INITIAL_PHRASE);
  const [frozen, setFrozen] = useState(false);
  const [linked, setLinked] = useState(true);
  const [gravity, setGravity] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('拉住任意一个字，试着往外带。');
  const [error, setError] = useState('');
  const [glyphs, setGlyphs] = useState([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldRef.current) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    renderPoster(context, {
      world: worldRef.current,
      width: WIDTH,
      height: HEIGHT,
      inverted: stateRef.current.inverted,
      selectedId: stateRef.current.selectedId,
      showHandles: stateRef.current.selectedId !== null && !stateRef.current.frozen,
      phrase: stateRef.current.phrase,
      frozen: stateRef.current.frozen,
    });
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    previousTime.current = 0;
  }, []);

  const wake = useCallback(() => {
    if (frameRef.current !== null || stateRef.current.frozen || document.hidden || !worldRef.current) return;
    previousTime.current = 0;
    const tick = (time) => {
      frameRef.current = null;
      if (stateRef.current.frozen || document.hidden || !worldRef.current) return;
      const delta = previousTime.current ? (time - previousTime.current) / 1000 : 1 / 60;
      previousTime.current = time;
      stepWorld(worldRef.current, delta, { linked: stateRef.current.linked, gravity: stateRef.current.gravity });
      draw();
      if (worldRef.current.grab || !isWorldAtRest(worldRef.current)) frameRef.current = requestAnimationFrame(tick);
      else previousTime.current = 0;
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [draw]);

  const clearDrag = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (worldRef.current) releaseGrab(worldRef.current);
    if (drag && canvasRef.current?.hasPointerCapture(drag.pointerId)) canvasRef.current.releasePointerCapture(drag.pointerId);
    canvasRef.current?.removeAttribute('data-dragging');
  }, []);

  const build = useCallback(
    (text) => {
      const context = canvasRef.current?.getContext('2d');
      if (!context) return false;
      stop();
      clearDrag();
      const characters = segmentPhrase(text);
      const metrics = createGlyphMetrics(context, characters);
      worldRef.current = createWorld({ width: WIDTH, height: HEIGHT, glyphs: metrics });
      stateRef.current.selectedId = null;
      stateRef.current.phrase = text;
      stateRef.current.gravity = false;
      setGravity(false);
      setSelectedId(null);
      setGlyphs(worldRef.current.bodies.map(({ id, text: glyph }) => ({ id, text: glyph })));
      setPhrase(text);
      draw();
      return true;
    },
    [clearDrag, draw, stop],
  );

  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    const resize = () => {
      if (!canvas) return;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(bounds.width * scale));
      canvas.height = Math.max(1, Math.round((canvas.width * HEIGHT) / WIDTH));
      draw();
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyReducedMotion = () => {
      if (!reduced.matches) return;
      stateRef.current.frozen = true;
      setFrozen(true);
      stop();
      clearDrag();
      if (worldRef.current) settleWorld(worldRef.current);
      setStatus('已按系统偏好定格。你可以点击“继续拉扯”开始。');
      draw();
    };
    applyReducedMotion();
    resize();
    const prepareFonts = async () => {
      try {
        await document.fonts?.load('900 224px "Portfolio Haas"');
        await document.fonts?.ready;
      } catch {
        // System Chinese/Latin fallbacks remain usable offline.
      }
      if (mounted && build(INITIAL_PHRASE)) setReady(true);
    };
    prepareFonts();
    const observer = new ResizeObserver(resize);
    if (canvas) observer.observe(canvas);
    const visibility = () => {
      if (document.hidden) {
        clearDrag();
        stop();
      } else wake();
    };
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', applyReducedMotion);
    return () => {
      mounted = false;
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', applyReducedMotion);
      clearDrag();
      stop();
    };
  }, [build, clearDrag, draw, stop, wake]);

  const select = (id) => {
    stateRef.current.selectedId = id;
    setSelectedId(id);
    draw();
  };

  const pointFor = (event) => {
    const bounds = canvasRef.current.getBoundingClientRect();
    return { x: ((event.clientX - bounds.left) / bounds.width) * WIDTH, y: ((event.clientY - bounds.top) / bounds.height) * HEIGHT };
  };

  const pointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0 || stateRef.current.frozen || !worldRef.current) return;
    const point = pointFor(event);
    const id = hitTest(worldRef.current, point.x, point.y);
    select(id);
    if (id === null) return;
    event.preventDefault();
    canvasRef.current.focus({ preventScroll: true });
    grabBody(worldRef.current, id, point.x, point.y);
    dragRef.current = { pointerId: event.pointerId };
    canvasRef.current.setPointerCapture(event.pointerId);
    canvasRef.current.setAttribute('data-dragging', 'true');
    setStatus('松手会留下惯性。试试拉动不同的字。');
    wake();
  };

  const pointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId || !worldRef.current) return;
    event.preventDefault();
    const point = pointFor(event);
    moveGrab(worldRef.current, point.x, point.y);
    wake();
  };

  const pointerUp = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    clearDrag();
    wake();
  };

  const toggleFrozen = () => {
    const next = !stateRef.current.frozen;
    stateRef.current.frozen = next;
    setFrozen(next);
    clearDrag();
    if (next) {
      stop();
      if (worldRef.current) settleWorld(worldRef.current);
      setStatus('这一刻，定格了。可以保存，也可以继续调整。');
      draw();
    } else {
      setStatus('继续拉扯。构图仍是刚才的样子。');
      wake();
    }
  };

  const moveSelected = (dx, dy) => {
    if (!worldRef.current || stateRef.current.frozen) return;
    const id = stateRef.current.selectedId ?? worldRef.current.bodies[0]?.id;
    if (id === undefined) return;
    select(id);
    nudgeBody(worldRef.current, id, dx, dy);
    wake();
  };

  const keyDown = (event) => {
    if (event.isComposing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) toggleFrozen();
    } else if (event.key === '[' || event.key === ']') {
      event.preventDefault();
      const bodies = worldRef.current?.bodies || [];
      const index = bodies.findIndex((body) => body.id === stateRef.current.selectedId);
      const origin = index < 0 && event.key === '[' ? 0 : index;
      const next = (origin + (event.key === ']' ? 1 : -1) + bodies.length) % bodies.length;
      if (bodies[next]) select(bodies[next].id);
    } else if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const delta = event.shiftKey ? 45 : 14;
      moveSelected(event.key === 'ArrowLeft' ? -delta : Number(event.key === 'ArrowRight') * delta, event.key === 'ArrowUp' ? -delta : Number(event.key === 'ArrowDown') * delta);
    } else if (event.key === 'Escape') {
      clearDrag();
      select(null);
      wake();
    }
  };

  const applyPhrase = (event) => {
    event.preventDefault();
    const characters = segmentPhrase(input, 100);
    if (!characters.length) {
      setError('先写下一句话，再放进画布。');
      return;
    }
    if (characters.length > 18) {
      setError('最多放 18 个字，请把这句话缩短一点。');
      return;
    }
    setError('');
    build(input.trim());
    setStatus(stateRef.current.frozen ? '新文字已放好。点击“继续拉扯”开始。' : '新文字已放好。挑一个字，拉出去。');
  };

  const save = async () => {
    if (!worldRef.current || saving) return;
    clearDrag();
    stop();
    settleWorld(worldRef.current);
    stateRef.current.frozen = true;
    setFrozen(true);
    setSaving(true);
    setError('');
    draw();
    try {
      const output = document.createElement('canvas');
      output.width = WIDTH * 2;
      output.height = HEIGHT * 2;
      const context = output.getContext('2d');
      if (!context) throw new Error('canvas');
      context.scale(2, 2);
      renderPoster(context, { world: worldRef.current, width: WIDTH, height: HEIGHT, inverted: stateRef.current.inverted, phrase: stateRef.current.phrase, showHandles: false, frozen: true });
      const blob = await new Promise((resolve) => {
        output.toBlob(resolve, 'image/png');
      });
      if (!blob) throw new Error('export');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = '字由-我的海报.png';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus('PNG 已生成（2000 × 2200）。请查看浏览器下载。');
    } catch {
      setError('图片没能保存。构图还在，请重试或用浏览器截图保存。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.root} data-type-play>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="返回陈祉辰的网站">
          <SignatureMark />
          <span>
            字由<span className={styles.wordmarkSlash}> / </span>
            <small>TYPE PLAY</small>
          </span>
        </a>
        <a className={styles.back} href="/">
          返回网站 <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className={styles.workspace}>
        <div className={styles.stage}>
          <div className={styles.stageHeading}>
            <span>
              <i data-frozen={frozen} />
              {frozen ? '构图已定格' : '文字，可以不规矩。'}
            </span>
            <span className={styles.stageMeta}>实时排版实验</span>
          </div>
          <div className={styles.paperSpace}>
            <div className={styles.paper} data-frozen={frozen} data-inverted={inverted}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                width={WIDTH}
                height={HEIGHT}
                tabIndex={0}
                aria-label={`排版画布：${phrase}`}
                aria-describedby={`${fieldId}-keyboard`}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={pointerUp}
                onLostPointerCapture={pointerUp}
                onKeyDown={keyDown}
                onDragStart={(event) => event.preventDefault()}
              >
                {phrase}。使用右侧的字块选择和方向按钮也能调整海报。
              </canvas>
              {!ready && <p className={styles.loading}>正在准备画布…</p>}
              {frozen && (
                <span className={styles.freezeStamp} aria-hidden="true">
                  定格
                </span>
              )}
            </div>
          </div>
          <div className={styles.stageFoot}>
            <span>{frozen ? '留住这个瞬间。' : '拉住一个字，再松手。'}</span>
            <span>你的文字 · 你的构图</span>
          </div>
        </div>

        <aside className={styles.tools} aria-label="海报工具">
          <div className={styles.toolIntro}>
            <h1>
              把一句话，
              <br />
              玩成一张海报<span>。</span>
            </h1>
            <p>
              拉扯、碰撞、松手。
              <br />
              字会跟着你的动作走。
            </p>
          </div>
          <form className={styles.phraseForm} onSubmit={applyPhrase}>
            <label htmlFor={fieldId}>
              写下你的话 <span>{segmentPhrase(input, 100).length} / 18</span>
            </label>
            <div className={styles.inputWrap}>
              <textarea
                id={fieldId}
                value={input}
                maxLength={200}
                rows={2}
                onChange={(event) => setInput(event.target.value)}
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={`${fieldId}-feedback`}
              />
              <button type="submit" disabled={!ready} aria-label="把这句话放进画布">
                ↗
              </button>
            </div>
          </form>

          <div className={styles.switches}>
            <button
              type="button"
              aria-pressed={linked}
              onClick={() => {
                stateRef.current.linked = !linked;
                setLinked(!linked);
                wake();
              }}
            >
              <span>
                邻字牵引<small>{linked ? '拉一个，带动一串' : '每个字，独立移动'}</small>
              </span>
              <i aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={gravity}
              onClick={() => {
                stateRef.current.gravity = !gravity;
                setGravity(!gravity);
                wake();
              }}
              disabled={frozen}
            >
              <span>
                让字落下来<small>{gravity ? '顺着重力，堆在一起' : '悬浮在你放开的位置'}</small>
              </span>
              <i aria-hidden="true" />
            </button>
          </div>

          <div className={styles.secondaryActions}>
            <button
              type="button"
              aria-pressed={inverted}
              onClick={() => {
                stateRef.current.inverted = !inverted;
                setInverted(!inverted);
                draw();
              }}
            >
              <span aria-hidden="true">◐</span> 黑白反转
            </button>
            <button
              type="button"
              onClick={() => {
                build(phrase);
                setStatus('文字回到起点，重新玩一遍。');
              }}
              disabled={!ready}
            >
              <span aria-hidden="true">↺</span> 重新排好
            </button>
          </div>

          <div className={styles.actions}>
            <button className={styles.freezeButton} type="button" onClick={toggleFrozen} disabled={!ready} aria-pressed={frozen}>
              <span>{frozen ? '继续拉扯' : '定格构图'}</span>
              <span aria-hidden="true">{frozen ? '↗' : '▣'}</span>
            </button>
            <button className={styles.saveButton} type="button" onClick={save} disabled={!ready || saving}>
              {saving ? '正在生成…' : '保存 PNG'} <span aria-hidden="true">↓</span>
            </button>
          </div>
          <p className={styles.feedback} role="status" id={`${fieldId}-feedback`} data-error={Boolean(error)}>
            {error || status}
          </p>

          <details className={styles.keyboardTools}>
            <summary>
              不用鼠标，也能玩 <span aria-hidden="true">+</span>
            </summary>
            <p id={`${fieldId}-keyboard`}>选一个字，用方向键移动；Shift 加速。[ ] 换字，空格定格。也可以点击下面的方向按钮。</p>
            <div className={styles.glyphPicker} role="group" aria-label="选择要移动的字">
              {glyphs.map(({ text, id }, index) => (
                <button type="button" key={id} aria-label={`选择第 ${index + 1} 个字：${text}`} aria-pressed={selectedId === id} onClick={() => select(id)}>
                  {text}
                </button>
              ))}
            </div>
            <div className={styles.nudge} role="group" aria-label="移动选中的字">
              <button type="button" aria-label="向左移动" disabled={frozen} onClick={() => moveSelected(-30, 0)}>
                ←
              </button>
              <button type="button" aria-label="向上移动" disabled={frozen} onClick={() => moveSelected(0, -30)}>
                ↑
              </button>
              <button type="button" aria-label="向下移动" disabled={frozen} onClick={() => moveSelected(0, 30)}>
                ↓
              </button>
              <button type="button" aria-label="向右移动" disabled={frozen} onClick={() => moveSelected(30, 0)}>
                →
              </button>
            </div>
          </details>
          <p className={styles.privacy}>
            只在你的浏览器里发生。
            <br />
            不上传文字，不调用 AI。
          </p>
        </aside>
      </div>
    </main>
  );
}
