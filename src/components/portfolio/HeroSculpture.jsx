import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { BufferAttribute, BufferGeometry, MathUtils } from 'three';

import styles from './HeroSculpture.module.scss';

function StaticSculpture() {
  return (
    <div className={styles.fallback} aria-hidden="true">
      <span className={styles.graphiteLoop} />
      <span className={styles.limeLoop} />
    </div>
  );
}

class SculptureBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    const { failed } = this.state;
    const { children } = this.props;
    return failed ? <StaticSculpture /> : children;
  }
}

// A rounded, broad ribbon section gives each loop a polished edge and a quiet,
// readable face. The slight twist catches the studio lights as the object turns.
function createRibbonGeometry() {
  const geometry = new BufferGeometry();
  const segments = 128;
  const sides = 24;
  const positions = [];
  const indices = [];

  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = (segment / segments) * Math.PI * 2;
    const twist = Math.sin(angle * 2) * 0.13;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    for (let side = 0; side <= sides; side += 1) {
      const crossAngle = (side / sides) * Math.PI * 2;
      const cosCross = Math.cos(crossAngle);
      const sinCross = Math.sin(crossAngle);
      const radial = Math.sign(cosCross) * Math.abs(cosCross) ** 0.5 * 0.25;
      const depth = Math.sign(sinCross) * Math.abs(sinCross) ** 0.5 * 0.17;
      const face = radial * Math.cos(twist) - depth * Math.sin(twist);
      const edge = radial * Math.sin(twist) + depth * Math.cos(twist);

      positions.push(cosAngle * (1.02 + face), sinAngle * (1.15 + face), edge);

      if (segment < segments && side < sides) {
        const point = segment * (sides + 1) + side;
        const next = point + sides + 1;
        indices.push(point, next, point + 1, point + 1, next, next + 1);
      }
    }
  }

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function SculptureScene({ animated, pointer, onReady }) {
  const sculpture = useRef();
  const elapsed = useRef(0);
  const geometry = useMemo(createRibbonGeometry, []);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!sculpture.current || !animated) return;
    elapsed.current += Math.min(delta, 0.05);
    const time = elapsed.current;
    const ease = 1 - Math.exp(-Math.min(delta, 0.05) * 3);

    sculpture.current.rotation.x = MathUtils.lerp(sculpture.current.rotation.x, 0.32 + Math.sin(time * 0.24) * 0.075 - pointer.current.y * 0.12, ease);
    sculpture.current.rotation.y = MathUtils.lerp(sculpture.current.rotation.y, -0.32 + Math.sin(time * 0.19) * 0.12 + pointer.current.x * 0.23, ease);
    sculpture.current.rotation.z = MathUtils.lerp(sculpture.current.rotation.z, -0.38 + Math.sin(time * 0.17) * 0.055, ease);
    sculpture.current.position.y = Math.sin(time * 0.52) * 0.09 + 0.07;
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 5, 4]} intensity={3} color="#ffffff" />
      <directionalLight position={[-4, 1, 3]} intensity={1.1} color="#e8f0ec" />
      <directionalLight position={[1, -3, -2]} intensity={1.8} color="#f3f8d5" />
      <Environment files="/other/studio_small_09_1k.hdr" environmentIntensity={0.9} />
      <group ref={sculpture} rotation={[0.32, -0.32, -0.38]} position={[0, 0.07, 0]} scale={1.06}>
        <mesh geometry={geometry} position={[-0.46, 0, 0]}>
          <meshPhysicalMaterial color="#373e39" metalness={0.94} roughness={0.21} clearcoat={0.45} clearcoatRoughness={0.2} />
        </mesh>
        <mesh geometry={geometry} position={[0.5, 0.03, 0.03]} rotation={[0.68, 0.06, 0.06]}>
          <meshPhysicalMaterial color="#dff46d" metalness={0.12} roughness={0.29} clearcoat={0.65} clearcoatRoughness={0.22} />
        </mesh>
      </group>
    </>
  );
}

export default function HeroSculpture({ className = '' }) {
  const host = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    setAvailable(Boolean(window.WebGLRenderingContext || window.WebGL2RenderingContext));
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    if (host.current) observer.observe(host.current);

    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element || reducedMotion) return undefined;

    const move = (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = element.getBoundingClientRect();
      pointer.current = { x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2, y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 };
    };
    const leave = () => {
      pointer.current = { x: 0, y: 0 };
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });

    return () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    };
  }, [reducedMotion]);

  const animated = !reducedMotion && visible && tabVisible;

  return (
    <div ref={host} className={`${styles.sculpture} ${className}`} role="img" aria-label="石墨色与青柠色圆环交织的立体雕塑，连接 AI 能力与真实产品。">
      <div className={styles.shadow} aria-hidden="true" />
      {!ready && <StaticSculpture />}
      {available && (
        <SculptureBoundary>
          <div className={`${styles.canvas} ${ready ? styles.ready : ''}`} aria-hidden="true">
            <Canvas
              camera={{ position: [0, 0, 7.7], fov: 34, near: 0.1, far: 30 }}
              dpr={[1, 1.5]}
              frameloop={animated ? 'always' : 'demand'}
              gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
              fallback={<StaticSculpture />}
              onCreated={({ gl }) => {
                gl.setClearColor('#f0f4f1', 0);
              }}
            >
              <Suspense fallback={null}>
                <SculptureScene animated={animated} pointer={pointer} onReady={markReady} />
              </Suspense>
            </Canvas>
          </div>
        </SculptureBoundary>
      )}
    </div>
  );
}
