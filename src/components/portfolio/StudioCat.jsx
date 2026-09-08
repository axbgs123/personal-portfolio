import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import catWalkAssets from '../../../public/art/cat-continuity-walk-v2/manifest.json';
import catTransitionAssets from '../../../public/art/cat-continuity-transition-v2/manifest.json';
import catActionAssets from '../../../public/art/cat-sprite-actions-v1/manifest.json';
import { actionSpriteIndex, advanceCatMotion, catMotionSample, createCatMotion, loadCatSprite, paintCatSprite, spriteFrame, walkSpriteFrame } from '../../lib/catSprite.mjs';
import styles from './studioCat.module.scss';

const POSE_LABELS = {
  sit: '正在看你',
  walk: '跟上你了',
  greet: '向你招手',
  pounce: '被光点吸引了',
  surprised: '向你抬起爪子',
  pet: '舒服得眯起眼',
  groom: '正在洗脸',
  stretch: '伸一个大懒腰',
  yawn: '打了个哈欠',
  sleep: '正在打盹',
  listen: '跟着钢琴打拍子',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const INSTRUMENTS = [
  { id: 'drum', label: '小鼓' },
  { id: 'guitar', label: '吉他' },
  { id: 'keyboard', label: '迷你键盘' },
  { id: 'shakers', label: '沙锤' },
];

function CatSprite() {
  const frame = spriteFrame(catActionAssets, 0);
  return (
    <svg className={styles.drawing} viewBox="0 32 384 336" fill="none" aria-hidden="true" data-cat-sprite="whole-generated-cat">
      <g className={styles.sideFacing}>
        <image
          data-cat-image
          className={styles.spriteImage}
          href={catActionAssets.href}
          x={frame.x}
          y={frame.y}
          width={catActionAssets.cellSize * catActionAssets.frameCount}
          height={catActionAssets.cellSize}
        />
        <path data-cat-hit className={styles.spriteHit} d={frame.hitArea} fill="transparent" />
      </g>
    </svg>
  );
}

export default function StudioCat() {
  const router = useRouter();
  const rootRef = useRef(null);
  const actorRef = useRef(null);
  const apiRef = useRef(null);
  const focusHandoffRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [resting, setResting] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [instrumentChoice, setInstrumentChoice] = useState('random');
  const isReading = router.pathname !== '/';

  useEffect(() => {
    const root = rootRef.current;
    const actor = actorRef.current;
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const spriteImage = root.querySelector('[data-cat-image]');
    const spriteHit = root.querySelector('[data-cat-hit]');
    const model = {
      x: window.innerWidth - 158,
      y: 0,
      target: window.innerWidth - 158,
      onStage: false,
      stageElement: null,
      beforeStageX: null,
      pointerX: window.innerWidth - 158,
      pointerY: window.innerHeight - 90,
      lastPointer: 0,
      lastAttention: performance.now(),
      lastPounce: 0,
      pose: 'sit',
      poseUntil: 0,
      idleStage: 0,
      scrollingUntil: 0,
      beat: 0,
      beatTime: 0,
      beatDirection: 1,
      beatCounter: 0,
      music: false,
      lastInstrument: null,
      instrumentChoice: 'random',
      motion: createCatMotion(window.innerWidth - 158),
      motionScale: window.innerWidth <= 640 ? 140 / 164 : 1,
      walkReady: false,
      transitionsReady: false,
      actionsReady: false,
      walkAssetState: 'loading',
      actionsAssetState: 'loading',
      paintedSprite: '',
      keyboardMoving: false,
      pointerOver: false,
      hoverFrozen: false,
      hoverPose: null,
      chatOpen: false,
      blocked: false,
      collapsed: false,
      resting: false,
      controlsOpen: false,
      reposition: null,
      frame: 0,
      previousFrame: 0,
    };
    let disposed = false;
    const releaseHoverLock = () => {
      model.hoverFrozen = false;
      model.hoverPose = null;
    };
    const writePosition = () => {
      model.x = clamp(model.x, 8, Math.max(8, window.innerWidth - 150));
      model.target = clamp(model.target, 8, Math.max(8, window.innerWidth - 150));
      actor.style.setProperty('--cat-x', `${model.x.toFixed(1)}px`);
      actor.style.setProperty('--cat-y', `${model.y.toFixed(1)}px`);
    };
    const leaveStage = () => {
      if (!model.onStage) return;
      model.reposition?.cancel();
      model.reposition = null;
      model.onStage = false;
      model.stageElement = null;
      model.x = model.beforeStageX ?? window.innerWidth - 158;
      model.target = model.x;
      model.y = 0;
      model.motion = createCatMotion(model.x, model.motion.direction);
      model.beforeStageX = null;
      root.dataset.pianoStage = 'false';
      writePosition();
    };
    const syncStage = () => {
      if (!model.music || model.resting) {
        leaveStage();
        return false;
      }
      const stage = model.stageElement?.isConnected ? model.stageElement : document.querySelector('[data-piano-pet-stage]');
      if (!stage) {
        leaveStage();
        return false;
      }
      const rect = stage.getBoundingClientRect();
      const headerBottom = document.querySelector('header[data-motion-background]')?.getBoundingClientRect().bottom || 70;
      const visible = rect.width > 0 && rect.height > 0 && rect.top >= headerBottom && rect.bottom <= window.innerHeight - 8 && rect.left >= 0 && rect.right <= window.innerWidth;
      if (!visible) {
        leaveStage();
        return false;
      }
      const arriving = !model.onStage;
      if (arriving) model.beforeStageX = model.x;
      model.onStage = true;
      model.stageElement = stage;
      const baseTop = root.getBoundingClientRect().top + actor.offsetTop;
      model.x = rect.left + (rect.width - actor.offsetWidth) / 2;
      model.y = rect.top + (rect.height - actor.offsetHeight) / 2 - baseTop;
      model.target = model.x;
      model.motion = createCatMotion(model.x, model.motion.direction);
      root.dataset.pianoStage = 'true';
      root.dataset.covered = 'false';
      writePosition();
      if (arriving && !reducedQuery.matches) {
        model.reposition?.cancel();
        model.reposition = actor.animate?.([{ transform: `translate3d(${model.x}px, ${model.y + 12}px, 0)` }, { transform: `translate3d(${model.x}px, ${model.y}px, 0)` }], {
          duration: 280,
          easing: 'cubic-bezier(.2,.8,.2,1)',
        });
      }
      return true;
    };
    const refreshSprite = (now = performance.now()) => {
      // Preserve both the complete image and its own alpha contour until the
      // first click/leave. Freezing locomotion alone still lets sit, pet, blink
      // and instrument changes move the click target out from under a pointer.
      if (model.hoverFrozen && !model.keyboardMoving && model.paintedSprite) return;
      let assets;
      let next;
      const motion = model.walkReady && model.transitionsReady && !reducedQuery.matches ? catMotionSample(model.motion, catWalkAssets, catTransitionAssets) : null;
      root.dataset.motion = model.motion.mode;
      root.dataset.pose = motion ? model.motion.mode : model.pose;
      root.dataset.direction = (motion?.direction ?? model.motion.renderDirection) < 0 ? 'left' : 'right';
      if (motion) {
        assets = motion.manifest;
        next = motion.frame;
      } else if (model.actionsReady) {
        assets = catActionAssets;
        const blink = !model.pointerOver && !model.chatOpen && now % 6800 > 6300 && now % 6800 < 6460;
        next = spriteFrame(assets, actionSpriteIndex({ pose: model.pose, instrument: model.lastInstrument, beat: model.beatCounter, reduced: reducedQuery.matches, blink }));
      } else if (model.walkReady) {
        // A failed action atlas retains a static whole cat and working alpha hit
        // target. It must never fall back to the rejected vector/part rig.
        assets = catWalkAssets;
        next = walkSpriteFrame(assets, 0);
      } else return;
      const key = `${assets.href}:${next.index}:${motion?.clip || model.pose}`;
      if (model.paintedSprite === key) return;
      model.paintedSprite = key;
      spriteImage.setAttribute('href', assets.href);
      spriteImage.setAttribute('width', String(assets.cellSize * assets.frameCount));
      spriteImage.setAttribute('height', String(assets.cellSize));
      paintCatSprite(spriteImage, spriteHit, next);
      root.dataset.spriteFrame = String(next.index);
      let kind = 'action';
      if (assets === catWalkAssets) kind = 'walk';
      if (assets === catTransitionAssets) kind = model.motion.mode;
      root.dataset.spriteKind = kind;
    };
    const pose = (name, duration = 1800, deliberate = false) => {
      if (model.resting && name !== 'sleep' && !deliberate) return;
      model.pose = name;
      model.poseUntil = performance.now() + duration;
      if (!model.hoverFrozen) root.dataset.pose = name;
      refreshSprite();
      if (deliberate) {
        model.lastAttention = performance.now();
        model.idleStage = 0;
        setAnnouncement(`墨墨${POSE_LABELS[name] || ''}。`);
      }
    };
    const selectInstrument = () => {
      let instrument = INSTRUMENTS.find((item) => item.id === model.instrumentChoice);
      if (!instrument) {
        const available = INSTRUMENTS.filter((item) => item.id !== model.lastInstrument);
        instrument = available[Math.floor(Math.random() * available.length)];
      }
      model.lastInstrument = instrument.id;
      root.dataset.performance = instrument.id;
      setAnnouncement(`墨墨拿出了${instrument.label}，跟着节拍协奏。`);
    };
    const syncSpriteAvailability = () => {
      let state = 'loading';
      if (model.walkAssetState === 'error' && model.actionsAssetState === 'error') state = 'error';
      if (model.walkReady || model.actionsReady) state = 'ready';
      root.dataset.catAsset = state;
      refreshSprite();
    };
    const canRun = () => !disposed && !document.hidden && !model.blocked && !model.collapsed;
    const frame = (now) => {
      model.frame = 0;
      if (!canRun() || reducedQuery.matches || (model.resting && model.motion.mode === 'sit')) return;
      const delta = Math.min(0.05, (now - model.previousFrame) / 1000 || 1 / 60);
      model.previousFrame = now;
      if (model.music) syncStage();
      const canFollow =
        model.walkReady &&
        model.transitionsReady &&
        !model.onStage &&
        !model.music &&
        !model.resting &&
        !model.controlsOpen &&
        !model.chatOpen &&
        (model.keyboardMoving || (!model.pointerOver && !touchQuery.matches && now > model.scrollingUntil)) &&
        now > model.poseUntil;
      model.motion = advanceCatMotion(
        { ...model.motion, x: model.x },
        { target: model.target, allowed: canFollow, freeze: model.hoverFrozen && !model.keyboardMoving, scale: model.motionScale, minX: 8, maxX: Math.max(8, window.innerWidth - 150) },
        delta,
        catTransitionAssets,
      );
      model.x = model.motion.x;
      root.dataset.walkFrame = String(walkSpriteFrame(catWalkAssets, model.motion.distance).index);
      writePosition();
      if (Math.abs(model.target - model.x) <= 3) model.keyboardMoving = false;
      if (now > model.poseUntil && model.pose !== 'sleep' && model.pose !== 'sit' && !model.music) pose('sit', 0);
      if (model.beat > 0) {
        model.beat = Math.max(0, model.beat - delta * 4.2);
        root.style.setProperty('--cat-beat', model.beat.toFixed(3));
        root.style.setProperty('--cat-sway', (model.beat * model.beatDirection).toFixed(3));
      }
      // A stopped/removed instrument cannot leave the pet stuck dancing.
      if (model.music && now - model.beatTime > 3500) {
        model.music = false;
        root.dataset.music = 'false';
        leaveStage();
        pose('sit', 0);
      }
      refreshSprite(now);
      model.frame = requestAnimationFrame(frame);
    };
    const resume = () => {
      if (!model.frame && canRun() && !reducedQuery.matches && (!model.resting || model.motion.mode !== 'sit')) {
        model.previousFrame = performance.now();
        model.frame = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(model.frame);
      model.reposition?.cancel();
      model.reposition = null;
      model.frame = 0;
      model.motion.velocity = 0;
    };
    const syncVisibility = () => {
      model.blocked = document.documentElement.dataset.portfolioTransition === 'playing' || Boolean(document.querySelector('[data-archive-dialog]'));
      root.dataset.blocked = String(model.blocked || document.hidden);
      root.inert = model.blocked || document.hidden;
      root.setAttribute('aria-hidden', String(model.blocked || document.hidden));
      root.dataset.reduced = String(reducedQuery.matches);
      if (reducedQuery.matches) {
        releaseHoverLock();
        model.motion = createCatMotion(model.x, model.motion.direction);
      }
      refreshSprite();
      if (model.blocked || document.hidden) stop();
      else resume();
    };
    const pointer = (event) => {
      if (!canRun() || touchQuery.matches || model.resting || model.controlsOpen || model.chatOpen || model.pointerOver || model.keyboardMoving) return;
      const now = performance.now();
      const distance = Math.hypot(event.clientX - model.pointerX, event.clientY - model.pointerY);
      const speed = distance / Math.max(16, now - model.lastPointer);
      const near = Math.hypot(event.clientX - model.x - 70, event.clientY - window.innerHeight + 95 - model.y) < 300;
      model.pointerX = event.clientX;
      model.pointerY = event.clientY;
      model.lastPointer = now;
      if (near) {
        model.lastAttention = now;
        model.idleStage = 0;
        if (model.pose === 'sleep') pose('yawn', 1400);
      }
      const interactive = event.target.closest?.('a, button, input, textarea, select, [role="button"]');
      if (!model.onStage && interactive && !root.contains(interactive) && event.clientY > window.innerHeight - 175) {
        model.target = event.clientX > window.innerWidth / 2 ? 18 : window.innerWidth - 158;
        return;
      }
      if (speed > 2.1 && near && now - model.lastPounce > 5000 && now > model.poseUntil && !model.music && !reducedQuery.matches) {
        model.lastPounce = now;
        pose('pounce', 1700);
      } else if (event.clientY > window.innerHeight * 0.63 && now > model.poseUntil && !root.contains(event.target) && !model.music && !reducedQuery.matches) {
        model.target = clamp(event.clientX - 70, 18, window.innerWidth - 158);
      }
    };
    const onScroll = () => {
      model.scrollingUntil = performance.now() + 750;
      if (!model.keyboardMoving) model.target = model.x;
      if (model.music) {
        model.reposition?.cancel();
        model.reposition = null;
        syncStage();
      }
      if (!model.keyboardMoving && !model.resting && !model.music && model.motion.mode !== 'sit') pose('sit', 800);
    };
    const resize = () => {
      model.motionScale = window.innerWidth <= 640 ? 140 / 164 : 1;
      if (syncStage()) return;
      model.target = clamp(model.target, 8, window.innerWidth - 150);
      writePosition();
    };
    const avoidControls = (settleForMusic = false) => {
      if (model.controlsOpen || model.onStage || model.pointerOver || model.keyboardMoving) return;
      // Read layout at most once per second, never on the animation frame.
      // A painted cat must not steal a click intended for a key or page link.
      const obstacles = [...document.querySelectorAll('a[href], button, input, textarea, select, [role="button"], main p, main h1, main h2, main h3')]
        .filter((element) => !root.contains(element))
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0 && rect.bottom > window.innerHeight - 150 && rect.top < window.innerHeight);
      const overlap = (x) =>
        obstacles.reduce(
          (sum, rect) =>
            sum + Math.max(0, Math.min(x + 119, rect.right) - Math.max(x + 23, rect.left)) * Math.max(0, Math.min(window.innerHeight - 24, rect.bottom) - Math.max(window.innerHeight - 134, rect.top)),
          0,
        );
      const covered = overlap(model.x) > 0;
      root.dataset.covered = String(covered);
      if (!covered || (model.music && !settleForMusic) || model.resting || (touchQuery.matches && !settleForMusic)) return;
      const candidates = [8, window.innerWidth - 150, window.innerWidth * 0.25 - 70, window.innerWidth * 0.75 - 70].map((x) => clamp(x, 8, window.innerWidth - 150));
      const safest = candidates.sort((a, b) => overlap(a) - overlap(b) || Math.abs(a - model.x) - Math.abs(b - model.x))[0];
      if (overlap(safest) < overlap(model.x)) {
        model.target = safest;
        model.poseUntil = 0;
        if (reducedQuery.matches || (settleForMusic && overlap(safest) === 0)) {
          const previousX = model.x;
          model.x = safest;
          writePosition();
          root.dataset.covered = String(overlap(model.x) > 0);
          if (!reducedQuery.matches) {
            model.reposition?.cancel();
            model.reposition = actor.animate?.([{ transform: `translate3d(${previousX}px, 0, 0)` }, { transform: `translate3d(${safest}px, 0, 0)` }], {
              duration: 420,
              easing: 'cubic-bezier(.2,.8,.2,1)',
            });
          }
        }
      }
    };
    const onMusic = (event) => {
      const { detail } = event;
      if (!detail || typeof detail.active !== 'boolean') return;
      if (detail.active && detail.source === 'preset' && detail.kind && detail.kind !== 'beat') return;
      const musicWasActive = model.music;
      model.music = detail.active && !model.resting;
      model.beatTime = performance.now();
      model.beat = model.music ? clamp(Number(detail.energy) || 0.5, 0.25, 1) * (detail.accent ? 1 : 0.72) : 0;
      model.target = model.x;
      root.dataset.music = String(model.music);
      if (model.music && canRun()) {
        if (!musicWasActive) {
          selectInstrument();
          if (!syncStage()) avoidControls(true);
        }
        const beatNumber = Number.isFinite(detail.absoluteBeat) ? detail.absoluteBeat : detail.beat;
        model.beatDirection = Math.floor(Number.isFinite(beatNumber) ? beatNumber : model.beatCounter) % 2 === 0 ? 1 : -1;
        model.beatCounter += 1;
        root.dataset.step = model.beatDirection > 0 ? 'left' : 'right';
        if (model.poseUntil < performance.now() || ['sit', 'listen', 'sleep', 'yawn', 'groom', 'stretch'].includes(model.pose)) pose('listen', 1000);
        refreshSprite();
        resume();
      } else if (!model.music) {
        leaveStage();
        avoidControls();
        if (model.pose === 'listen') pose('sit', 0);
      }
      if (!model.music || reducedQuery.matches) {
        root.style.setProperty('--cat-beat', '0');
        root.style.setProperty('--cat-sway', '0');
      }
    };
    const interval = window.setInterval(() => {
      if (!canRun()) return;
      avoidControls();
      if (model.resting || model.music || model.controlsOpen || model.chatOpen || model.pointerOver || model.keyboardMoving || model.motion.mode !== 'sit' || performance.now() < model.poseUntil)
        return;
      if (reducedQuery.matches && model.pose !== 'sit' && model.pose !== 'sleep') pose('sit', 0);
      const idle = performance.now() - model.lastAttention;
      const sequence = [
        { after: 7000, pose: 'groom', duration: 3100 },
        { after: 15000, pose: 'stretch', duration: 2600 },
        { after: 23000, pose: 'yawn', duration: 2200 },
        { after: 32000, pose: 'sleep', duration: Infinity },
      ];
      const next = sequence[model.idleStage];
      if (next && idle > next.after) {
        model.idleStage += 1;
        model.target = model.x;
        pose(next.pose, next.duration);
      }
    }, 1000);
    const onChatState = (event) => {
      model.chatOpen = Boolean(event.detail?.open);
      model.target = model.x;
      if (model.chatOpen) {
        releaseHoverLock();
        setControlsOpen(false);
        if (model.motion.mode !== 'sit') pose('sit', 0);
      }
    };
    const observer = new MutationObserver(syncVisibility);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-portfolio-transition'] });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pointermove', pointer, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('portfolio:piano-rhythm', onMusic);
    window.addEventListener('portfolio:cat-chat-state', onChatState);
    window.addEventListener('portfolio:intro-start', syncVisibility);
    window.addEventListener('portfolio:intro-complete', syncVisibility);
    document.addEventListener('visibilitychange', syncVisibility);
    reducedQuery.addEventListener('change', syncVisibility);
    apiRef.current = {
      pose: (name, duration) => {
        releaseHoverLock();
        model.keyboardMoving = false;
        model.target = model.x;
        if (model.resting) {
          model.resting = false;
          setResting(false);
        }
        pose(name, duration, true);
        resume();
      },
      pet: (event) => {
        if (model.resting || touchQuery.matches || performance.now() < model.poseUntil || model.pose === 'pet' || model.motion.mode !== 'sit') return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientY < bounds.top + bounds.height * 0.61) {
          if (model.hoverFrozen) model.hoverPose = { name: 'pet', duration: 2000, deliberate: true };
          else pose('pet', 2000, true);
        }
      },
      surprise: () => {
        if (!model.resting && !model.music && model.motion.mode === 'sit' && performance.now() > model.poseUntil) {
          if (model.hoverFrozen) model.hoverPose = { name: 'surprised', duration: 650 };
          else pose('surprised', 650);
        }
      },
      hover: (value) => {
        model.pointerOver = value;
        if (!value) {
          const pending = model.hoverPose;
          releaseHoverLock();
          if (pending && !model.resting && !model.chatOpen && !model.music && model.motion.mode === 'sit') pose(pending.name, pending.duration, pending.deliberate);
          else refreshSprite();
          resume();
          return;
        }
        model.hoverFrozen = true;
        model.hoverPose = null;
        model.keyboardMoving = false;
        // Freeze any avoidance tween at its painted position before a click.
        if (model.reposition) {
          const bounds = actor.getBoundingClientRect();
          model.reposition.cancel();
          model.reposition = null;
          model.x = bounds.left;
          model.y = bounds.top - root.getBoundingClientRect().top - actor.offsetTop;
          writePosition();
        }
        model.target = model.x;
        model.lastAttention = performance.now();
        model.idleStage = 0;
        // Keep a stopped sprite under the pointer until click/leave, otherwise
        // switching to the narrower sitting silhouette can make the click miss.
        if (model.pose === 'sleep' && !model.resting) model.hoverPose = { name: 'yawn', duration: 1400 };
      },
      controls: (value) => {
        model.controlsOpen = value;
        if (value) model.keyboardMoving = false;
        if (value || !model.keyboardMoving) model.target = model.x;
      },
      requestChat: () => {
        releaseHoverLock();
        model.target = model.x;
        if (model.motion.mode !== 'sit') pose('sit', 0);
        setControlsOpen(false);
        if (!model.chatOpen) window.dispatchEvent(new CustomEvent('portfolio:cat-chat-open'));
      },
      instrument: (value) => {
        if (value !== 'random' && !INSTRUMENTS.some((item) => item.id === value)) return;
        model.instrumentChoice = value;
        if (model.music && !model.resting) {
          selectInstrument();
          pose('listen', 1000);
        }
      },
      collapse: (value) => {
        model.collapsed = value;
        model.target = model.x;
        if (value) stop();
        else resume();
      },
      rest: (value) => {
        releaseHoverLock();
        model.resting = value;
        setResting(value);
        model.keyboardMoving = false;
        model.music = false;
        leaveStage();
        model.beat = 0;
        root.dataset.music = 'false';
        root.style.setProperty('--cat-beat', '0');
        root.style.setProperty('--cat-sway', '0');
        model.target = model.x;
        pose(value ? 'sleep' : 'greet', value ? Infinity : 1900, true);
        if (value && model.motion.mode === 'sit') stop();
        else resume();
      },
      move: (direction) => {
        if (!canRun() || model.chatOpen) return;
        releaseHoverLock();
        model.resting = false;
        setResting(false);
        model.controlsOpen = false;
        setControlsOpen(false);
        model.target = clamp(model.x + direction * 100, 8, window.innerWidth - 150);
        model.keyboardMoving = Math.abs(model.target - model.x) > 3;
        model.scrollingUntil = 0;
        pose('sit', 0, true);
        if (reducedQuery.matches) {
          model.x = model.target;
          model.keyboardMoving = false;
          model.motion = createCatMotion(model.x, direction);
          writePosition();
        } else resume();
      },
    };
    writePosition();
    const disposeWalkAsset = loadCatSprite(catWalkAssets, (state) => {
      model.walkReady = state === 'ready';
      model.walkAssetState = state;
      root.dataset.walkAsset = state;
      if (state === 'error') {
        model.target = model.x;
        model.keyboardMoving = false;
        model.motion = createCatMotion(model.x, model.motion.direction);
        pose('sit', 0);
      }
      syncSpriteAvailability();
    });
    const disposeActionsAsset = loadCatSprite(catActionAssets, (state) => {
      model.actionsReady = state === 'ready';
      model.actionsAssetState = state;
      syncSpriteAvailability();
    });
    const disposeTransitionAsset = loadCatSprite(catTransitionAssets, (state) => {
      model.transitionsReady = state === 'ready';
      if (state === 'error') {
        model.target = model.x;
        model.keyboardMoving = false;
        model.motion = createCatMotion(model.x, model.motion.direction);
      }
      syncSpriteAvailability();
    });
    syncVisibility();
    return () => {
      disposed = true;
      disposeWalkAsset();
      disposeActionsAsset();
      disposeTransitionAsset();
      stop();
      clearInterval(interval);
      observer.disconnect();
      window.removeEventListener('pointermove', pointer);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', resize);
      window.removeEventListener('portfolio:piano-rhythm', onMusic);
      window.removeEventListener('portfolio:cat-chat-state', onChatState);
      window.removeEventListener('portfolio:intro-start', syncVisibility);
      window.removeEventListener('portfolio:intro-complete', syncVisibility);
      document.removeEventListener('visibilitychange', syncVisibility);
      reducedQuery.removeEventListener('change', syncVisibility);
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Reading gets an unobtrusive, reversible launcher instead of a moving pet.
    setCollapsed(isReading);
    setControlsOpen(false);
  }, [isReading, router.asPath]);

  useEffect(() => {
    apiRef.current?.collapse(collapsed);
    if (focusHandoffRef.current || rootRef.current?.contains(document.activeElement)) {
      const target = focusHandoffRef.current || (collapsed ? '[data-cat-launcher]' : '[data-cat-button]');
      focusHandoffRef.current = null;
      rootRef.current.querySelector(target)?.focus({ preventScroll: true });
    }
  }, [collapsed]);

  useEffect(() => {
    apiRef.current?.controls(controlsOpen);
    if (!controlsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && rootRef.current?.contains(event.target)) {
        event.stopPropagation();
        setControlsOpen(false);
        rootRef.current.querySelector('[data-cat-options]')?.focus({ preventScroll: true });
      }
    };
    const clickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setControlsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', clickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', clickOutside);
    };
  }, [controlsOpen]);

  const openChat = () => apiRef.current?.requestChat();
  const stretch = () => {
    apiRef.current?.pose('stretch', 2100);
  };
  const toggleRest = () => {
    apiRef.current?.rest(!resting);
  };

  return (
    <aside className={styles.root} ref={rootRef} data-studio-cat data-pose="sit" data-collapsed={collapsed} data-controls={controlsOpen} aria-label="桌面猫墨墨">
      <div className={styles.actor} ref={actorRef}>
        <button
          className={styles.catButton}
          data-cat-button
          type="button"
          aria-label="和墨墨聊聊，点击或按 Enter、空格打开聊天"
          aria-describedby="studio-cat-hint"
          tabIndex={collapsed ? -1 : 0}
          onClick={openChat}
          onPointerEnter={() => {
            apiRef.current?.hover(true);
            apiRef.current?.surprise();
          }}
          onPointerLeave={() => apiRef.current?.hover(false)}
          onPointerMove={(event) => apiRef.current?.pet(event)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              apiRef.current?.move(event.key === 'ArrowLeft' ? -1 : 1);
            } else if (event.key.toLowerCase() === 'r') stretch();
            else if (event.key.toLowerCase() === 's') toggleRest();
          }}
        >
          <CatSprite />
          <span className={styles.catSpark} aria-hidden="true">
            ✦
          </span>
          <span className={styles.catFallback}>墨墨 · 聊聊</span>
        </button>
      </div>
      <div className={styles.controls} hidden={collapsed}>
        <button
          className={styles.more}
          data-cat-options
          type="button"
          tabIndex={collapsed ? -1 : 0}
          aria-label="墨墨的互动选项"
          aria-expanded={controlsOpen}
          onClick={() => {
            apiRef.current?.controls(!controlsOpen);
            setControlsOpen(!controlsOpen);
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="6" cy="12" r="1.4" fill="currentColor" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
            <circle cx="18" cy="12" r="1.4" fill="currentColor" />
          </svg>
        </button>
        <div className={styles.panel} hidden={!controlsOpen || collapsed}>
          <span>墨墨 / MO</span>
          <p id="studio-cat-hint">
            点击墨墨，直接聊聊。
            <br />
            摸摸头，或用下方按钮逗它。
          </p>
          <div>
            <button type="button" onClick={() => apiRef.current?.pose('pounce', 1800)}>
              逗猫
            </button>
            <button type="button" onClick={stretch}>
              伸懒腰
            </button>
            <button type="button" onClick={toggleRest}>
              {resting ? '叫醒' : '休息'}
            </button>
            <button
              type="button"
              onClick={() => {
                focusHandoffRef.current = '[data-cat-launcher]';
                setCollapsed(true);
                setControlsOpen(false);
              }}
            >
              收起
            </button>
          </div>
          <label className={styles.instrumentChoice} htmlFor="studio-cat-instrument">
            <span>协奏乐器</span>
            <select
              id="studio-cat-instrument"
              value={instrumentChoice}
              onChange={(event) => {
                setInstrumentChoice(event.target.value);
                apiRef.current?.instrument(event.target.value);
              }}
            >
              <option value="random">每曲随机</option>
              {INSTRUMENTS.map((instrument) => (
                <option key={instrument.id} value={instrument.id}>
                  {instrument.label}
                </option>
              ))}
            </select>
          </label>
          <button className={styles.chatEntry} type="button" onClick={openChat}>
            <span>和墨墨聊聊</span>
            <span aria-hidden="true">↗</span>
          </button>
          <small>键盘：← → 移动 · R 伸懒腰 · S 休息</small>
        </div>
      </div>
      <button
        className={styles.launcher}
        data-cat-launcher
        type="button"
        hidden={!collapsed}
        aria-label="叫出桌面猫墨墨"
        onClick={() => {
          focusHandoffRef.current = '[data-cat-button]';
          setCollapsed(false);
          apiRef.current?.pose('greet', 2300);
        }}
      >
        <svg viewBox="0 0 30 30" width="24" height="24" aria-hidden="true">
          <path d="M6 15L5 5L12 10Q15 8 18 10L25 5L24 15C28 27 2 27 6 15Z" fill="currentColor" />
          <path d="M14 13L12 20Q15 24 19 20Z" fill="#f6f6f6" />
          <path d="M10 15H11M20 15H21" stroke="#f6f6f6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </span>
    </aside>
  );
}
