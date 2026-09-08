import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PianoRhythmClock from './pianoRhythmClock';
import styles from './pianoRhythm.module.scss';

const stringCount = 5;
const broadcast = (detail) => window.dispatchEvent(new CustomEvent('portfolio:piano-rhythm', { detail }));
const restingString = (index) => `M 4 ${26 + index * 12} H 316`;

const PianoRhythm = forwardRef(({ hostRef }, ref) => {
  const rootRef = useRef(null);
  const stringsRef = useRef([]);
  const cursorRef = useRef(null);
  const beatsRef = useRef([]);
  const countRef = useRef(null);
  const clockRef = useRef(new PianoRhythmClock());
  const lastBeatRef = useRef(0);
  const [tempo, setTempo] = useState({ bpm: 0, beatsPerBar: 4, source: 'live' });

  useEffect(() => {
    const clock = clockRef.current;
    return () => {
      // Child refs may already be detached before the parent's passive cleanup.
      const stopped = clock.stop();
      if (stopped) broadcast(stopped);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      start(options) {
        clockRef.current.start(options);
        setTempo({ bpm: options.bpm || 0, beatsPerBar: options.beatsPerBar || 4, source: options.source });
      },
      note(midi, time, velocity) {
        if (!clockRef.current.active) setTempo({ bpm: 0, beatsPerBar: 4, source: 'live' });
        clockRef.current.note(midi, time, velocity);
      },
      tick(time, reduced) {
        const frame = clockRef.current.sample(time);
        frame.events.forEach(broadcast);
        if (!frame.active) return;
        if (rootRef.current) rootRef.current.dataset.active = 'true';
        if (frame.beat !== lastBeatRef.current) {
          lastBeatRef.current = frame.beat;
          beatsRef.current.forEach((beat, index) => {
            if (beat) beat.dataset.current = String(index === frame.beat - 1);
          });
          if (countRef.current) countRef.current.textContent = frame.beat ? String(frame.beat).padStart(2, '0') : '—';
        }
        const beat = reduced ? 0 : frame.beatPulse;
        const note = reduced ? 0 : frame.notePulse;
        hostRef.current?.style.setProperty('--rhythm-beat', beat.toFixed(3));
        hostRef.current?.style.setProperty('--rhythm-note', note.toFixed(3));
        hostRef.current?.style.setProperty('--rhythm-position', `${(frame.position * 100).toFixed(2)}%`);
        if (cursorRef.current) {
          cursorRef.current.setAttribute('transform', `translate(${reduced ? 0 : (frame.phase * 308).toFixed(2)}, 0)`);
          cursorRef.current.style.opacity = clockRef.current.bpm && !reduced ? '0.35' : '0';
        }
        stringsRef.current.forEach((path, index) => {
          if (!path) return;
          const y = 26 + index * 12;
          const x = 42 + frame.position * 236;
          const displacement = (beat * 16 + note * 30) * (1 - Math.abs(2 - index) * 0.18) * (index % 2 ? -1 : 1);
          path.setAttribute('d', `M 4 ${y} C ${x * 0.54} ${y} ${x - 30} ${y + displacement} ${x} ${y + displacement} S 258 ${y} 316 ${y}`);
          path.style.opacity = String((index === 2 ? 0.55 : 0.2) + (beat * 0.2 + note * 0.22));
        });
      },
      stop() {
        const stopped = clockRef.current.stop();
        if (stopped) broadcast(stopped);
        lastBeatRef.current = 0;
        if (rootRef.current) rootRef.current.dataset.active = 'false';
        if (countRef.current) countRef.current.textContent = '—';
        if (cursorRef.current) cursorRef.current.style.opacity = '0';
        beatsRef.current.forEach((beat) => {
          if (beat) beat.dataset.current = 'false';
        });
        stringsRef.current.forEach((path, index) => {
          if (path) {
            path.setAttribute('d', restingString(index));
            path.style.opacity = String(index === 2 ? 0.55 : 0.2);
          }
        });
        hostRef.current?.style.setProperty('--rhythm-beat', '0');
        hostRef.current?.style.setProperty('--rhythm-note', '0');
      },
    }),
    [hostRef],
  );

  return (
    <div className={styles.rhythm} ref={rootRef} aria-hidden="true" data-piano-rhythm data-active="false">
      <div className={styles.visual}>
        <svg viewBox="0 0 320 102" fill="none" preserveAspectRatio="none">
          <path d="M4 16V86M316 16V86" stroke="currentColor" opacity=".18" />
          {Array.from({ length: stringCount }, (_, index) => (
            <path
              key={index}
              d={restingString(index)}
              stroke="currentColor"
              strokeWidth={index === 2 ? '1.5' : '1'}
              opacity={index === 2 ? '.55' : '.2'}
              ref={(element) => {
                stringsRef.current[index] = element;
              }}
            />
          ))}
          <path ref={cursorRef} d="M4 16V86" stroke="currentColor" opacity="0" />
        </svg>
        <span className={styles.beatCount} ref={countRef}>
          —
        </span>
      </div>
      <div className={styles.legend}>
        <span>{tempo.bpm ? `${tempo.bpm} BPM / 节拍` : '音符 / 原始节奏'}</span>
        <div className={styles.beats}>
          {Array.from({ length: tempo.beatsPerBar }, (_, index) => (
            <i
              key={index}
              ref={(element) => {
                beatsRef.current[index] = element;
              }}
              data-current="false"
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default PianoRhythm;
