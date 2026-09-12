import { useEffect, useRef, useState } from 'react';
import PianoSampler from './pianoAudio';
import PianoRhythm from './PianoRhythm';
import { pianoKeys, pianoPresets } from './pianoScores';
import styles from './homePiano.module.scss';

export default function HomePiano() {
  const host = useRef(null);
  const engine = useRef(null);
  const rhythm = useRef(null);
  const timer = useRef(null);
  const epoch = useRef(0);
  const alive = useRef(true);
  const [selected, setSelected] = useState(pianoPresets[0].id);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('点击琴键，或播放一首预设。');
  const stop = () => {
    epoch.current += 1;
    clearInterval(timer.current);
    engine.current?.cancelPreparation();
    engine.current?.stopAll();
    rhythm.current?.stop();
    setPlaying(false);
    setLoading(false);
    setNotes([]);
  };
  useEffect(() => {
    alive.current = true;
    let frame;
    let prior = '';
    const tick = () => {
      if (engine.current?.ready) {
        const active = engine.current.activeNotes();
        const signature = active.join(',');
        if (signature !== prior) {
          prior = signature;
          setNotes(active);
        }
        rhythm.current?.tick(engine.current.currentTime, matchMedia('(prefers-reduced-motion: reduce)').matches);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const hide = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', hide);
    return () => {
      alive.current = false;
      epoch.current += 1;
      clearInterval(timer.current);
      cancelAnimationFrame(frame);
      engine.current?.dispose();
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  const prepare = async () => {
    if (!engine.current) engine.current = new PianoSampler(0.55);
    const request = epoch.current;
    setLoading(true);
    try {
      await engine.current.prepare();
      return alive.current && request === epoch.current ? engine.current : null;
    } catch (error) {
      if (alive.current && error.name !== 'AbortError') setMessage(error.message);
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  };
  const playNote = async (midi) => {
    const audio = await prepare();
    if (!audio) return;
    const at = audio.currentTime + 0.01;
    audio.noteOn(midi, { time: at, duration: 0.5 });
    rhythm.current?.note(midi, at, 0.8);
  };
  const play = async () => {
    stop();
    const request = epoch.current;
    const audio = await prepare();
    if (!audio || request !== epoch.current) return;
    const score = pianoPresets.find((p) => p.id === selected);
    const start = audio.currentTime + 0.1;
    rhythm.current?.start({ startsAt: start, duration: score.duration, bpm: score.bpm, beatsPerBar: score.beatsPerBar, source: 'preset' });
    setPlaying(true);
    setMessage(`正在演奏《${score.title}》`);
    let index = 0;
    timer.current = setInterval(() => {
      if (request !== epoch.current) return;
      while (index < score.events.length && start + score.events[index].time < audio.currentTime + 0.15) {
        const event = score.events[index];
        const at = start + event.time;
        audio.noteOn(event.midi, { time: at, duration: event.duration, velocity: event.velocity });
        rhythm.current?.note(event.midi, at, event.velocity);
        index += 1;
      }
      if (audio.currentTime > start + score.duration + 0.4) {
        stop();
        setMessage('轮到你了。');
      }
    }, 25);
  };
  let playLabel = playing ? '停止 ■' : '播放 ▷';
  if (loading) playLabel = '取消载入';
  return (
    <section className={styles.piano} id="playground" ref={host} aria-label="简约钢琴">
      <div className={styles.toolbar}>
        <h2>弹一段，换个节奏。</h2>
        <div>
          <select
            aria-label="选择钢琴曲"
            value={selected}
            onChange={(e) => {
              stop();
              setSelected(e.target.value);
            }}
          >
            {pianoPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button type="button" onClick={playing || loading ? stop : play}>
            {playLabel}
          </button>
        </div>
      </div>
      <div className={styles.rhythm}>
        <PianoRhythm ref={rhythm} hostRef={host} />
        <span data-piano-pet-stage className={styles.petStage} />
      </div>
      <div className={styles.keys} role="group" aria-label="钢琴琴键">
        {pianoKeys.map((key) => (
          <button
            key={key.midi}
            type="button"
            aria-label={`弹奏 ${key.note}`}
            className={`${key.black ? styles.black : styles.white} ${notes.includes(key.midi) ? styles.active : ''}`}
            style={{ left: `${(key.position / 15) * 100}%` }}
            onClick={() => playNote(key.midi)}
          >
            <span>{key.note}</span>
          </button>
        ))}
      </div>
      <div className={styles.caption}>
        <span role="status">{message}</span>
        <a href="/audio/piano/ATTRIBUTION.md" target="_blank" rel="noreferrer">
          琴声：Alexander Holm · CC BY 3.0
        </a>
      </div>
    </section>
  );
}
