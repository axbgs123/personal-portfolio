import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { MathUtils, SRGBColorSpace, Vector2 } from 'three';

import styles from './KineticArtwork.module.scss';

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uImage;
  uniform float uTime;
  uniform float uImageAspect;
  uniform float uViewAspect;
  uniform float uActivity;
  uniform float uPressure;
  uniform vec2 uPointer;
  varying vec2 vUv;

  void main() {
    // The same centered cover crop as the static image underneath the canvas.
    vec2 coverScale = vec2(
      min(uViewAspect / uImageAspect, 1.0),
      min(uImageAspect / uViewAspect, 1.0)
    );

    vec2 delta = vUv - uPointer;
    vec2 scaledDelta = delta * vec2(uViewAspect, 1.0);
    float distanceToPointer = length(scaledDelta);
    vec2 direction = scaledDelta / max(distanceToPointer, 0.001);
    direction.x /= uViewAspect;

    float ripple = sin(distanceToPointer * (20.0 - uPressure * 4.0) - uTime * (1.65 + uPressure * 2.7));
    float influence = exp(-distanceToPointer * mix(6.0, 3.6, uPressure)) * uActivity;
    vec2 refraction = direction * ripple * influence * (0.011 + uPressure * 0.078);
    vec2 curl = vec2(-scaledDelta.y, scaledDelta.x) * influence * uPressure * 0.16;
    curl.x /= uViewAspect;

    vec2 breathing = vec2(
      sin(vUv.y * 7.5 + uTime * 0.38),
      cos(vUv.x * 7.0 - uTime * 0.31)
    ) * 0.00125;

    // Pin the outer edges so the artwork stays integrated with its container.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.12), vUv)
      * smoothstep(vec2(0.0), vec2(0.12), vec2(1.0) - vUv);
    vec2 warped = vUv + (refraction + curl + breathing) * edge.x * edge.y;
    vec2 imageUv = (warped - 0.5) * coverScale + 0.5;

    gl_FragColor = texture2D(uImage, clamp(imageUv, 0.001, 0.999));
    #include <colorspace_fragment>
  }
`;

class ArtworkBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    const { onError } = this.props;
    onError?.();
  }

  render() {
    const { failed } = this.state;
    const { children } = this.props;
    // The accessible static image remains mounted beneath this enhancement.
    return failed ? null : children;
  }
}

function ArtworkPlane({ src, animated, pointer, onReady }) {
  const texture = useTexture(src);
  const { size } = useThree();
  const rendered = useRef(false);
  const uniforms = useMemo(
    () => ({
      uImage: { value: texture },
      uTime: { value: 0 },
      uImageAspect: { value: texture.image.width / texture.image.height },
      uViewAspect: { value: 1 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uActivity: { value: 0 },
      uPressure: { value: 0 },
    }),
    [texture],
  );

  useEffect(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useEffect(() => {
    uniforms.uViewAspect.value = size.width / Math.max(size.height, 1);
  }, [size, uniforms]);

  const revealArtwork = useCallback(() => {
    if (rendered.current) return;
    rendered.current = true;
    onReady();
  }, [onReady]);

  useFrame((_, delta) => {
    if (!animated) return;
    const step = Math.min(delta, 0.05);
    uniforms.uTime.value += step;
    pointer.current.speed *= Math.exp(-step * 4);
    uniforms.uPointer.value.x = MathUtils.damp(uniforms.uPointer.value.x, pointer.current.x, 5, step);
    uniforms.uPointer.value.y = MathUtils.damp(uniforms.uPointer.value.y, pointer.current.y, 5, step);
    let activity = 0;
    if (pointer.current.pressed) activity = 1;
    else if (pointer.current.active) activity = 0.16 + pointer.current.speed * 0.84;
    uniforms.uActivity.value = MathUtils.damp(uniforms.uActivity.value, activity, pointer.current.pressed ? 6 : 2.4, step);
    uniforms.uPressure.value = MathUtils.damp(uniforms.uPressure.value, pointer.current.pressed ? 1 : 0, pointer.current.pressed ? 4.2 : 2.4, step);
  });

  return (
    <mesh frustumCulled={false} onAfterRender={revealArtwork}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} toneMapped={false} depthTest={false} depthWrite={false} />
    </mesh>
  );
}

export default function KineticArtwork({ src = '/art/hero-sculpture.webp', alt = '黑色舞台上舒展的液态铬膜雕塑', className = '', onPressChange }) {
  const host = useRef(null);
  const canvasElement = useRef(null);
  const pointer = useRef({ x: 0.5, y: 0.5, active: false, speed: 0, pressed: false });
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const updatePressed = useCallback(
    (pressed) => {
      pointer.current.pressed = pressed;
      setIsPressed(pressed);
      onPressChange?.(pressed);
    },
    [onPressChange],
  );
  const fallBackToImage = useCallback(() => {
    setAvailable(false);
    setReady(false);
    updatePressed(false);
  }, [updatePressed]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setTabVisible(!document.hidden);
    const pauseForIntro = () => setIntroPlaying(true);
    const resumeAfterIntro = () => setIntroPlaying(false);
    updateMotion();
    updateVisibility();
    setIntroPlaying(document.documentElement.dataset.portfolioIntro === 'playing');
    setAvailable(Boolean(window.WebGLRenderingContext || window.WebGL2RenderingContext));
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    window.addEventListener('portfolio:intro-start', pauseForIntro);
    window.addEventListener('portfolio:intro-complete', resumeAfterIntro);

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    if (host.current) observer.observe(host.current);

    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      window.removeEventListener('portfolio:intro-start', pauseForIntro);
      window.removeEventListener('portfolio:intro-complete', resumeAfterIntro);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setReady(false);
  }, [src, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !visible || !tabVisible || introPlaying) {
      pointer.current.active = false;
      updatePressed(false);
    }
  }, [reducedMotion, visible, tabVisible, introPlaying, updatePressed]);

  useEffect(
    () => () => {
      canvasElement.current?.removeEventListener('webglcontextlost', fallBackToImage);
    },
    [fallBackToImage],
  );

  useEffect(() => {
    const element = host.current;
    if (!element || reducedMotion || !available) return undefined;

    const updatePointer = (event) => {
      const bounds = element.getBoundingClientRect();
      const x = MathUtils.clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1);
      const y = MathUtils.clamp(1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1);
      const speed = Math.min(Math.hypot(x - pointer.current.x, y - pointer.current.y) * 35, 1);
      Object.assign(pointer.current, { x, y, speed: Math.max(speed, pointer.current.speed), active: true });
    };
    const move = (event) => {
      if (event.pointerType === 'touch' && !pointer.current.pressed) return;
      updatePointer(event);
    };
    const press = (event) => {
      if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
      updatePointer(event);
      updatePressed(true);
    };
    const release = (event) => {
      if (event?.pointerType === 'touch') pointer.current.active = false;
      updatePressed(false);
    };
    const leave = () => {
      pointer.current.active = false;
      updatePressed(false);
    };
    const keyDown = (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (event.repeat) return;
      pointer.current.active = true;
      updatePressed(true);
    };
    const keyUp = (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      leave();
    };

    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerdown', press, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });
    element.addEventListener('keydown', keyDown);
    element.addEventListener('keyup', keyUp);
    element.addEventListener('blur', leave);
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', leave);

    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerdown', press);
      element.removeEventListener('pointerleave', leave);
      element.removeEventListener('keydown', keyDown);
      element.removeEventListener('keyup', keyUp);
      element.removeEventListener('blur', leave);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', leave);
    };
  }, [reducedMotion, available, updatePressed]);

  const enhanced = available && !reducedMotion;
  const animated = enhanced && visible && tabVisible && !introPlaying;
  const interactive = enhanced && ready;

  return (
    <div
      ref={host}
      className={`${styles.artwork} ${interactive ? styles.interactive : ''} ${isPressed ? styles.pressed : ''} ${className}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? '互动艺术：按住鼠标或空格键扰动，松开还原' : undefined}
      aria-pressed={interactive ? isPressed : undefined}
    >
      <Image src={src} alt={alt} fill unoptimized priority sizes="(max-width: 768px) 100vw, 70vw" className={styles.image} />
      {enhanced && (
        <ArtworkBoundary key={src} onError={fallBackToImage}>
          <div className={`${styles.canvas} ${ready ? styles.ready : ''}`} aria-hidden="true">
            <Canvas
              dpr={[1, 1.5]}
              frameloop={animated ? 'always' : 'demand'}
              gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
              fallback={null}
              onCreated={({ gl }) => {
                gl.setClearColor('#111112', 0);
                canvasElement.current = gl.domElement;
                gl.domElement.addEventListener('webglcontextlost', fallBackToImage);
              }}
            >
              <Suspense fallback={null}>
                <ArtworkPlane src={src} animated={animated} pointer={pointer} onReady={markReady} />
              </Suspense>
            </Canvas>
          </div>
        </ArtworkBoundary>
      )}
    </div>
  );
}
