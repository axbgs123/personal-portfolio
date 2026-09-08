import { useCallback, useEffect, useRef, useState } from 'react';
import PianoSampler from './pianoAudio';
import PianoRhythm from './PianoRhythm';
import { createFollowSteps, keyboardNotes, noteName, pianoKeys, pianoPresets, PianoTakeRecorder, recordingLimit, recordingNoteLimit } from './pianoScores';
import styles from './pianoLab.module.scss';

const meterCount = 40;
const formatDuration = (seconds) => (Math.ceil(seconds * 10) / 10).toFixed(1);
const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`;

export default function PianoLab({ id = 'playground' }) {
  const rootRef = useRef(null);
  const keyboardRef = useRef(null);
  const keyRefs = useRef(new Map());
  const meterRefs = useRef([]);
  const rhythmRef = useRef(null);
  const engineRef = useRef(null);
  const manualRef = useRef(new Map());
  const mountedRef = useRef(false);
  const reducedRef = useRef(false);
  const volumeRef = useRef(0.65);
  const epochRef = useRef(0);
  const timerRef = useRef(null);
  const frameRef = useRef(null);
  const playingRef = useRef(false);
  const keySignatureRef = useRef('');
  const keyboardHandlerRef = useRef(null);
  const followRef = useRef(null);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const takeRef = useRef(null);
  const [selectedId, setSelectedId] = useState('joy');
  const [mode, setMode] = useState('free');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [volume, setVolume] = useState(0.65);
  const [sustain, setSustain] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [hasSound, setHasSound] = useState(false);
  const [lastNote, setLastNote] = useState('—');
  const [focusedMidi, setFocusedMidi] = useState(60);
  const [progress, setProgress] = useState(0);
  const [playbackKind, setPlaybackKind] = useState('preset');
  const [followActive, setFollowActive] = useState(false);
  const [followIndex, setFollowIndex] = useState(0);
  const [followMisses, setFollowMisses] = useState(0);
  const [followDone, setFollowDone] = useState(false);
  const [wrongNote, setWrongNote] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [take, setTake] = useState(null);
  const [status, setStatus] = useState('点击“启用琴声”，或直接播放一段预设。');
  const selected = pianoPresets.find((preset) => preset.id === selectedId);
  const followSteps = createFollowSteps(selected);
  const expected = followActive ? followSteps[followIndex] : null;
  let followButtonLabel = '开始跟弹';
  if (followActive) followButtonLabel = '重新开始';
  else if (followDone) followButtonLabel = '再跟弹一遍';
  let recordButtonLabel = take ? '重新录制' : '开始录制';
  if (recording) recordButtonLabel = '停止录制';
  const canStopSolo = mode === 'record' && !recording && !playing && hasSound;
  let audioButtonLabel = loading ? '取消载入' : '启用琴声';
  let audioButtonIcon = ready ? '✓' : '↗';
  if (loading) audioButtonIcon = '×';
  if (canStopSolo) {
    audioButtonLabel = '停止琴声';
    audioButtonIcon = '■';
  }
  let visibleProgress = progress;
  let progressLabel = playbackKind === 'take' ? '录制旋律回放进度' : '预设演奏进度';
  if (!playing && mode === 'follow') {
    visibleProgress = Math.round((followIndex / followSteps.length) * 100);
    progressLabel = '跟弹进度';
  } else if (recording) {
    visibleProgress = Math.round((recordElapsed / recordingLimit) * 100);
    progressLabel = '录制时长';
  }

  const resetMeters = useCallback(() => {
    meterRefs.current.forEach((bar) => {
      if (bar) bar.style.transform = 'scaleY(0.025)';
    });
  }, []);

  const showNotes = useCallback((notes) => {
    const sorted = [...new Set(notes)].sort((first, second) => first - second);
    const signature = sorted.join(',');
    if (signature !== keySignatureRef.current) {
      keySignatureRef.current = signature;
      if (mountedRef.current) {
        setActiveNotes(sorted);
        if (sorted.length) setLastNote(sorted.map(noteName).join(' · '));
      }
    }
  }, []);

  const startVisuals = useCallback(() => {
    if (frameRef.current !== null || document.hidden) return;
    let lastPaint = 0;
    const draw = (time) => {
      frameRef.current = null;
      const engine = engineRef.current;
      if (!mountedRef.current || document.hidden || !engine) return;
      if (time - lastPaint >= 30) {
        lastPaint = time;
        rhythmRef.current?.tick(engine.currentTime, reducedRef.current);
        const notes = engine.activeNotes();
        showNotes(notes);
        setHasSound(engine.voices.size > 0);
        const spectrum = reducedRef.current ? null : engine.spectrum(meterCount);
        meterRefs.current.forEach((bar, index) => {
          if (!bar) return;
          const value = spectrum ? spectrum[index] : Number(notes.some((note) => Math.abs((note - 60) / 24 - index / (meterCount - 1)) < 0.07)) * 0.62;
          bar.style.transform = `scaleY(${Math.max(0.025, value)})`;
        });
      }
      if (playingRef.current || engine.voices.size) frameRef.current = requestAnimationFrame(draw);
      else {
        showNotes([]);
        resetMeters();
        rhythmRef.current?.stop();
      }
    };
    frameRef.current = requestAnimationFrame(draw);
  }, [resetMeters, showNotes]);

  const finishRecording = useCallback(() => {
    if (recordTimerRef.current !== null) window.clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    const recorder = recorderRef.current;
    if (!recorder) return '';
    recorderRef.current = null;
    const result = recorder.finish(engineRef.current?.currentTime || recorder.startedAt);
    if (mountedRef.current) {
      setRecording(false);
      setRecordElapsed(recorder.elapsed(engineRef.current?.currentTime || recorder.startedAt));
      setRecordCount(result.count);
    }
    if (result.count) {
      takeRef.current = result;
      if (mountedRef.current) setTake(result);
      return `已收好 ${result.count} 个音符、${formatDuration(result.duration)} 秒的旋律。点击“回放旋律”试听。`;
    }
    return takeRef.current ? '这一遍没有录到音符，已保留上一段旋律。' : '还没有录到音符。点击“开始录制”，再按下琴键。';
  }, []);

  const stopEverything = useCallback(
    (message = '') => {
      const wasActive = playingRef.current || followRef.current || recorderRef.current || manualRef.current.size > 0 || engineRef.current?.voices.size > 0;
      const recordingMessage = finishRecording();
      const cancelledLoading = engineRef.current?.cancelPreparation();
      epochRef.current += 1;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      timerRef.current = null;
      frameRef.current = null;
      playingRef.current = false;
      followRef.current = null;
      manualRef.current.clear();
      engineRef.current?.stopAll();
      rhythmRef.current?.stop();
      showNotes([]);
      resetMeters();
      if (mountedRef.current) {
        setPlaying(false);
        setFollowActive(false);
        setWrongNote(null);
        setHasSound(false);
        setProgress(0);
        if (cancelledLoading) setLoading(false);
        if (recordingMessage) setStatus(message ? `${message} ${recordingMessage}` : recordingMessage);
        else if (message) setStatus(message);
        else if (cancelledLoading) setStatus('已取消琴声载入。点击“启用琴声”可以重试。');
        else if (wasActive) setStatus('已停止。点击琴键，或重新播放预设。');
      }
    },
    [finishRecording, resetMeters, showNotes],
  );

  const prepareAudio = useCallback(async () => {
    if (!engineRef.current) engineRef.current = new PianoSampler(volumeRef.current);
    const engine = engineRef.current;
    const request = epochRef.current;
    if (!engine.ready) {
      setLoading(true);
      setStatus('正在唤醒钢琴，首次需要载入琴声…');
    }
    try {
      const wasReady = engine.ready;
      await engine.prepare();
      if (!mountedRef.current || engineRef.current !== engine || request !== epochRef.current) return null;
      setReady(true);
      setLoading(false);
      if (!wasReady) setStatus('琴声已就绪。用鼠标、触摸或电脑键盘演奏。');
      return engine;
    } catch (error) {
      if (mountedRef.current && engineRef.current === engine && request === epochRef.current && error.name !== 'AbortError') {
        setLoading(false);
        setStatus(error.message || '琴声未能载入，请点击重试。');
      }
      return null;
    }
  }, []);

  const revealPianoKey = useCallback((midi) => {
    const container = keyboardRef.current;
    const key = keyRefs.current.get(midi);
    if (!container || !key) return;
    const left = key.offsetLeft;
    const right = left + key.offsetWidth;
    if (left < container.scrollLeft + 12 || right > container.scrollLeft + container.clientWidth - 12) {
      container.scrollTo({ left: Math.max(0, left - container.clientWidth / 2 + key.offsetWidth / 2), behavior: 'auto' });
    }
  }, []);

  const judgeFollowNote = useCallback(
    (midi) => {
      const session = followRef.current;
      if (!session) return false;
      const next = session.steps[session.index];
      if (midi !== next.midi) {
        session.misses += 1;
        setFollowMisses(session.misses);
        setWrongNote(midi);
        setStatus(`你弹了 ${noteName(midi)}。下一音是 ${next.note}，电脑键 ${next.shortcut}；可以慢慢来。`);
        return true;
      }
      session.index += 1;
      setFollowIndex(session.index);
      setWrongNote(null);
      if (session.index === session.steps.length) {
        followRef.current = null;
        setFollowActive(false);
        setFollowDone(true);
        setStatus(`跟弹完成！你弹完了《${session.title}》的 ${session.steps.length} 个旋律音符${session.misses ? `，纠正了 ${session.misses} 次错音` : '，全部一次弹对'}。`);
      } else {
        const following = session.steps[session.index];
        setStatus(`第 ${session.index} 个音弹对了。下一音 ${following.note}，电脑键 ${following.shortcut}。`);
        revealPianoKey(following.midi);
      }
      return true;
    },
    [revealPianoKey],
  );

  const pressNote = useCallback(
    async (midi, token, velocity = 0.78) => {
      if (manualRef.current.has(token)) return;
      const key = { midi, voice: null };
      manualRef.current.set(token, key);
      setLastNote(noteName(midi));
      showNotes([...manualRef.current.values()].map((entry) => entry.midi));
      const engine = await prepareAudio();
      if (!engine || !mountedRef.current || manualRef.current.get(token) !== key) return;
      key.voice = engine.noteOn(midi, { velocity });
      if (key.voice !== null) rhythmRef.current?.note(midi, engine.voices.get(key.voice)?.startsAt ?? engine.currentTime, velocity);
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.noteDown(token, midi, engine.currentTime, velocity);
        setRecordCount(recorder.count);
      } else if (!judgeFollowNote(midi) && !playingRef.current) setStatus('自由演奏中。按住琴键延长声音，也可以组合多个音符。');
      startVisuals();
    },
    [judgeFollowNote, prepareAudio, showNotes, startVisuals],
  );

  const releaseNote = useCallback(
    (token) => {
      const key = manualRef.current.get(token);
      if (!key) return;
      manualRef.current.delete(token);
      if (key.voice !== null) engineRef.current?.noteOff(key.voice);
      recorderRef.current?.noteUp(token, engineRef.current?.currentTime || 0);
      showNotes([...manualRef.current.values()].map((entry) => entry.midi));
      startVisuals();
    },
    [showNotes, startVisuals],
  );

  const tapNote = useCallback(
    async (midi) => {
      const request = epochRef.current;
      const engine = await prepareAudio();
      if (!engine || request !== epochRef.current) return;
      const voice = engine.noteOn(midi, { duration: 0.5 });
      if (voice !== null) rhythmRef.current?.note(midi, engine.voices.get(voice)?.startsAt ?? engine.currentTime, 0.78);
      const recorder = recorderRef.current;
      if (recorder) {
        const token = `tap-${voice}`;
        recorder.noteDown(token, midi, engine.currentTime);
        recorder.noteUp(token, engine.currentTime + 0.5, { ignoreSustain: true });
        setRecordCount(recorder.count);
      } else if (!judgeFollowNote(midi) && !playingRef.current) setStatus('自由演奏中。用方向键选择音符，回车弹奏。');
      setLastNote(noteName(midi));
      startVisuals();
    },
    [judgeFollowNote, prepareAudio, startVisuals],
  );

  const playSequence = async (sequence, title, kind = 'preset') => {
    stopEverything();
    const request = epochRef.current;
    const engine = await prepareAudio();
    if (!engine || request !== epochRef.current || !mountedRef.current) return;
    const startsAt = engine.currentTime + 0.1;
    rhythmRef.current?.start({
      startsAt,
      duration: sequence.duration,
      bpm: kind === 'preset' ? sequence.bpm : 0,
      beatsPerBar: sequence.beatsPerBar || 4,
      source: kind === 'preset' ? 'preset' : 'replay',
    });
    let nextNote = 0;
    let displayedProgress = -1;
    playingRef.current = true;
    setPlaying(true);
    setPlaybackKind(kind);
    setStatus(kind === 'take' ? '正在按原始节奏回放，音符会拨动弦线、点亮琴键。' : `正在演奏《${title}》。拍点标记节奏，弦线响应音符；你也可以一起弹。`);

    // Timers only fill a short scheduling window. Note timing uses the audio clock.
    const schedule = () => {
      if (request !== epochRef.current || !mountedRef.current) return;
      const now = engine.currentTime;
      while (nextNote < sequence.events.length && startsAt + sequence.events[nextNote].time < now + 0.18) {
        const event = sequence.events[nextNote];
        const voice = engine.noteOn(event.midi, { time: startsAt + event.time, duration: event.duration, velocity: event.velocity });
        if (voice !== null) rhythmRef.current?.note(event.midi, engine.voices.get(voice)?.startsAt ?? startsAt + event.time, event.velocity);
        nextNote += 1;
      }
      const fraction = Math.min(100, Math.max(0, Math.floor(((now - startsAt) / sequence.duration) * 100)));
      if (fraction !== displayedProgress) {
        displayedProgress = fraction;
        setProgress(fraction);
      }
      if (now >= startsAt + sequence.duration + 0.35) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        playingRef.current = false;
        rhythmRef.current?.stop();
        setPlaying(false);
        setStatus(kind === 'take' ? '回放结束。这段旋律只保留在当前页面，刷新后会清空。' : `《${title}》演奏结束。接下来，轮到你。`);
      }
    };
    schedule();
    timerRef.current = window.setInterval(schedule, 25);
    startVisuals();
  };

  const startFollowing = async () => {
    stopEverything();
    const request = epochRef.current;
    const engine = await prepareAudio();
    if (!engine || request !== epochRef.current || !mountedRef.current) return;
    const steps = createFollowSteps(selected);
    followRef.current = { title: selected.title, steps, index: 0, misses: 0 };
    setFollowIndex(0);
    setFollowMisses(0);
    setFollowDone(false);
    setWrongNote(null);
    setFollowActive(true);
    setStatus(`跟弹《${selected.title}》。先弹 ${steps[0].note}，电脑键 ${steps[0].shortcut}。只看音高，不催节奏。`);
    revealPianoKey(steps[0].midi);
  };

  const startRecording = async () => {
    stopEverything();
    const request = epochRef.current;
    const engine = await prepareAudio();
    if (!engine || request !== epochRef.current || !mountedRef.current) return;
    const recorder = new PianoTakeRecorder({ startedAt: engine.currentTime });
    recorder.setSustain(engine.sustain, engine.currentTime);
    recorderRef.current = recorder;
    setRecording(true);
    setRecordElapsed(0);
    setRecordCount(0);
    setStatus(`正在录制，最长 ${recordingLimit} 秒。按下琴键，完成后点击“停止录制”；不使用麦克风。`);
    recordTimerRef.current = window.setInterval(() => {
      if (request !== epochRef.current || recorderRef.current !== recorder || !mountedRef.current) return;
      setRecordElapsed(recorder.elapsed(engine.currentTime));
      if (recorder.reachedLimit(engine.currentTime)) stopEverything(`已达到 ${recorder.count >= recordingNoteLimit ? `${recordingNoteLimit} 个音符` : `${recordingLimit} 秒`}的录制上限。`);
    }, 100);
  };

  const changeMode = (nextMode) => {
    if (mode === nextMode) return;
    stopEverything();
    setMode(nextMode);
    setFollowIndex(0);
    setFollowMisses(0);
    setFollowDone(false);
    if (nextMode === 'follow') setStatus('选择一首曲子，点击“开始跟弹”。弹对一个音，再前进一个音。');
    else if (nextMode === 'record') setStatus('点击“开始录制”，留下最多 30 秒的旋律。仅记录本页的琴键，不使用麦克风、不上传。');
    else setStatus('自由演奏。用鼠标、触摸或电脑键盘，弹出自己的节奏。');
  };

  useEffect(() => {
    mountedRef.current = true;
    const root = rootRef.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    const onMotionChange = (event) => {
      reducedRef.current = event.matches;
    };
    const onWindowBlur = () => stopEverything();
    const onSearchOpened = () => stopEverything();
    const onVisibility = () => {
      if (document.hidden) stopEverything();
    };
    // Delegate only within this instrument; page-level shortcuts remain untouched.
    const onKeyDown = (event) => keyboardHandlerRef.current?.(event);
    const onKeyUp = (event) => {
      if (manualRef.current.has(`key-${event.code}`)) {
        event.preventDefault();
        releaseNote(`key-${event.code}`);
      }
    };
    const onFocusOut = (event) => {
      if (root.contains(event.relatedTarget)) return;
      if (playingRef.current && event.relatedTarget?.closest?.('[data-studio-cat]')) {
        // Petting the nearby cat may move focus, but must not cut the music.
        // Manually held keys are released; preset/replay scheduling keeps running.
        [...manualRef.current.entries()].forEach(([token, key]) => {
          releaseNote(token);
          if (key.voice !== null) engineRef.current?.release(key.voice);
        });
        return;
      }
      stopEverything();
    };
    const onDocumentFocus = (event) => {
      if (!playingRef.current || root.contains(event.target) || event.target?.closest?.('[data-studio-cat]')) return;
      // Also covers piano → cat → search/menu, where focus no longer leaves root.
      stopEverything();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stopEverything();
      },
      { threshold: 0 },
    );
    observer.observe(root);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('keyup', onKeyUp);
    root.addEventListener('focusout', onFocusOut);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('portfolio:search-opened', onSearchOpened);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('focusin', onDocumentFocus);
    media.addEventListener('change', onMotionChange);
    return () => {
      mountedRef.current = false;
      stopEverything();
      observer.disconnect();
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('keyup', onKeyUp);
      root.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('portfolio:search-opened', onSearchOpened);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('focusin', onDocumentFocus);
      media.removeEventListener('change', onMotionChange);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [releaseNote, stopEverything]);

  const handleKeyboardDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing || event.nativeEvent?.isComposing || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const onPianoKey = event.target.closest('[data-piano-midi]');
    if (onPianoKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      let next = Number(onPianoKey.dataset.pianoMidi);
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 12, ArrowDown: -12 };
      if (event.key === 'Home') next = 60;
      else if (event.key === 'End') next = 84;
      else next = Math.min(84, Math.max(60, next + steps[event.key]));
      setFocusedMidi(next);
      keyRefs.current.get(next)?.focus({ preventScroll: true });
      keyRefs.current.get(next)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return;
    }
    const midi = keyboardNotes[event.code];
    if (!midi || event.repeat) return;
    event.preventDefault();
    pressNote(midi, `key-${event.code}`);
  };
  keyboardHandlerRef.current = handleKeyboardDown;

  const pointerDown = (event, midi) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setFocusedMidi(midi);
    const velocity = event.pointerType === 'touch' && event.pressure > 0 ? Math.min(0.95, 0.55 + event.pressure * 0.4) : 0.78;
    pressNote(midi, `pointer-${event.pointerId}`, velocity);
  };

  const pointerMove = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const token = `pointer-${event.pointerId}`;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-piano-midi]');
    const midi = target && keyboardRef.current.contains(target) ? Number(target.dataset.pianoMidi) : null;
    if (manualRef.current.get(token)?.midi === midi) return;
    releaseNote(token);
    if (midi !== null) pressNote(midi, token);
  };

  const changeVolume = (event) => {
    const value = Number(event.currentTarget.value) / 100;
    volumeRef.current = value;
    setVolume(value);
    engineRef.current?.setVolume(value);
  };

  const changeSustain = () => {
    const next = !sustain;
    setSustain(next);
    if (!engineRef.current) engineRef.current = new PianoSampler(volumeRef.current);
    engineRef.current.setSustain(next);
    recorderRef.current?.setSustain(next, engineRef.current.currentTime);
  };

  return (
    <section className={styles.lab} id={id} ref={rootRef} aria-labelledby={`${id}-title`}>
      <header className={styles.heading}>
        <div className={styles.eyebrow}>
          <span>声音实验 / PIANO</span>
          <span>25 KEYS · C4—C6</span>
        </div>
        <div className={styles.titleRow}>
          <h2 id={`${id}-title`}>
            让想法，
            <br />
            有回响。
          </h2>
          <p>
            按下琴键，
            <br />
            或让一段熟悉的旋律先开始。<span>鼠标 / 触摸 / 电脑键盘</span>
          </p>
        </div>
      </header>

      <div className={styles.instrument}>
        <div className={styles.soundDisplay} aria-hidden="true">
          <div className={styles.noteDisplay}>
            <span>此刻的音符</span>
            <strong className={lastNote.length > 8 ? styles.chordLabel : ''}>{lastNote}</strong>
          </div>
          <PianoRhythm ref={rhythmRef} hostRef={rootRef} />
          <div className={styles.meter}>
            <div>
              {Array.from({ length: meterCount }, (_, index) => (
                <i
                  key={`frequency-${index}`}
                  ref={(bar) => {
                    meterRefs.current[index] = bar;
                  }}
                />
              ))}
            </div>
            <span>实时频谱 / 声音的形状</span>
          </div>
          <div className={styles.companionStage} data-piano-pet-stage>
            <span>墨墨的伴奏席</span>
          </div>
        </div>

        <div className={styles.modeBar} role="group" aria-label="钢琴玩法">
          {[
            ['free', '自由演奏'],
            ['follow', '跟弹模式'],
            ['record', '录制旋律'],
          ].map(([value, label]) => (
            <button type="button" key={value} aria-pressed={mode === value} onClick={() => changeMode(value)}>
              {label}
            </button>
          ))}
        </div>

        {mode !== 'record' && (
          <div className={styles.scoreBar}>
            <div className={styles.scoreGroup}>
              <span className={styles.controlLabel}>听一段</span>
              <div className={styles.scoreChoices} role="group" aria-label="选择预设曲目">
                {pianoPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    aria-pressed={selectedId === preset.id}
                    onClick={() => {
                      stopEverything();
                      setSelectedId(preset.id);
                      setFollowIndex(0);
                      setFollowMisses(0);
                      setFollowDone(false);
                      setStatus(`已选择《${preset.title}》。${mode === 'follow' ? '点击“开始跟弹”，从第一个音开始。' : '点击播放，或自由演奏。'}`);
                    }}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.transport}>
              <span className={styles.scoreMeta}>
                {selected.composer}
                <small>
                  {selected.seconds} 秒 · {selected.bpm} BPM
                </small>
              </span>
              <button
                type="button"
                className={styles.playButton}
                onClick={() => {
                  if (!loading && !playing) playSequence(selected, selected.title);
                }}
                aria-disabled={loading || playing}
                aria-label={`播放${selected.title}`}
              >
                <span aria-hidden="true">▶</span>
                {mode === 'follow' ? '听示范' : '播放'}
              </button>
              <button
                type="button"
                className={styles.stopButton}
                onClick={() => stopEverything('已停止。可以换一首，也可以自己弹。')}
                disabled={!playing && !loading && !hasSound && !followActive}
                aria-label="停止演奏"
              >
                <span aria-hidden="true">■</span>停止
              </button>
            </div>
          </div>
        )}

        {mode === 'follow' && (
          <div className={styles.followPanel}>
            <div className={styles.followCue}>
              <span>{followDone ? '这一段，完成了' : '下一音'}</span>
              <strong>{followDone ? '✓' : (expected || followSteps[0]).note}</strong>
              <small>{expected ? `电脑键 ${expected.shortcut}` : '只看音高，不催节奏'}</small>
            </div>
            <div className={styles.followSequence}>
              <p>
                <strong>{followIndex}</strong> / {followSteps.length} 个旋律音符
                {followMisses > 0 && <span> · 纠正 {followMisses} 次</span>}
              </p>
              <div aria-label="接下来的旋律音符">
                {followSteps.slice(followIndex, followIndex + 6).map((step, index) => (
                  <span key={step.index} className={index === 0 && followActive ? styles.nextPitch : ''}>
                    {step.note}
                  </span>
                ))}
                {followDone && <span className={styles.completePhrase}>这一次，是你弹出来的。</span>}
              </div>
              <small>{wrongNote === null ? '按标记的琴键，弹对后继续。' : `刚才是 ${noteName(wrongNote)}，试试 ${(expected || followSteps[0]).note}。`}</small>
            </div>
            <div className={styles.modeActions}>
              <button
                type="button"
                className={styles.playButton}
                aria-disabled={loading}
                onClick={() => {
                  if (!loading) startFollowing();
                }}
              >
                {followButtonLabel}
              </button>
              <button type="button" className={styles.stopButton} onClick={() => changeMode('free')}>
                退出跟弹
              </button>
            </div>
          </div>
        )}

        {mode === 'record' && (
          <div className={styles.recordPanel}>
            <div className={styles.recordClock}>
              <span>
                <i className={recording ? styles.recordingDot : ''} aria-hidden="true" />
                {recording ? '正在录制' : '我的旋律'}
              </span>
              <strong>{formatTime(recording ? recordElapsed : take?.duration || 0)}</strong>
              <small>{recording ? `${recordCount} 个音符 / 最长 ${recordingLimit} 秒` : `${take?.count || 0} 个音符`}</small>
            </div>
            <div className={styles.recordDescription}>
              <p>{take ? '留住刚才那一段。' : '弹一小段，听听自己的旋律。'}</p>
              <span>{recording ? '按下 / 松开 / 延音，都会被记住。' : '没有麦克风，也不上传。只记录你弹下的音符。'}</span>
              <small>{take ? '新录制有音符时才替换上一段；刷新页面会清空。' : '最多 30 秒，只保留在当前页面。'}</small>
            </div>
            <div className={styles.modeActions}>
              <button
                type="button"
                className={styles.playButton}
                aria-disabled={loading || playing}
                onClick={() => {
                  if (loading || playing) return;
                  if (recording) stopEverything();
                  else startRecording();
                }}
              >
                {recordButtonLabel}
              </button>
              <button
                type="button"
                className={styles.stopButton}
                aria-disabled={loading || recording || !take?.count}
                onClick={() => {
                  if (loading || recording || !take?.count) return;
                  if (playing) stopEverything('回放已停止，你的旋律仍保留在本页。');
                  else playSequence(take, '我的旋律', 'take');
                }}
              >
                {playing ? '停止回放' : '回放旋律'}
              </button>
            </div>
            <p className={styles.recordEmpty}>{take ? `${formatDuration(take.duration)} 秒的旋律，随时可以再听一遍。` : '还没有可回放的旋律。开始录制后，按下琴键试试。'}</p>
          </div>
        )}

        <div className={styles.playProgress} role="progressbar" aria-label={progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={visibleProgress}>
          <span style={{ transform: `scaleX(${visibleProgress / 100})` }} />
        </div>

        <div className={styles.settings}>
          <button
            type="button"
            className={styles.enableButton}
            onClick={() => {
              if (loading) stopEverything('已取消琴声载入，可以重新启用。');
              else if (canStopSolo) stopEverything('琴声已停止，录好的旋律仍保留在本页。');
              else if (!loading && !ready) prepareAudio();
            }}
            aria-disabled={ready && !canStopSolo && !loading}
          >
            {audioButtonLabel}
            <span aria-hidden="true">{audioButtonIcon}</span>
            {ready && !canStopSolo && <span className={styles.readyText}>已就绪</span>}
          </button>
          <div className={styles.soundControls}>
            <label className={styles.volume} htmlFor={`${id}-volume`}>
              <span>音量</span>
              <input
                id={`${id}-volume`}
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(volume * 100)}
                onChange={changeVolume}
                aria-label="钢琴音量"
                aria-valuetext={`${Math.round(volume * 100)}%`}
              />
              <output>{Math.round(volume * 100)}</output>
            </label>
            <button type="button" className={styles.sustain} onClick={changeSustain} aria-pressed={sustain}>
              延音<span>{sustain ? '开' : '关'}</span>
            </button>
          </div>
        </div>

        <div className={styles.keyboardScroll} ref={keyboardRef}>
          <div className={styles.keyboard} role="group" aria-label="钢琴键盘，C4 至 C6" aria-describedby={`${id}-keyboard-help`}>
            {pianoKeys.map((key) => (
              <button
                type="button"
                key={key.midi}
                ref={(node) => {
                  if (node) keyRefs.current.set(key.midi, node);
                }}
                className={`${styles.pianoKey} ${key.black ? styles.blackKey : styles.whiteKey} ${activeNotes.includes(key.midi) ? styles.keyActive : ''} ${expected?.midi === key.midi ? styles.keyExpected : ''} ${wrongNote === key.midi ? styles.keyIncorrect : ''}`}
                style={{ left: `${(key.position / 15) * 100}%`, width: `${((key.black ? 0.64 : 1) / 15) * 100}%` }}
                tabIndex={focusedMidi === key.midi ? 0 : -1}
                aria-label={`${key.note}，${key.black ? '黑键' : '白键'}，电脑键 ${key.shortcut}${expected?.midi === key.midi ? '，跟弹下一音' : ''}`}
                aria-pressed={activeNotes.includes(key.midi)}
                data-piano-midi={key.midi}
                data-lenis-prevent
                data-cursor="弹奏"
                onFocus={() => setFocusedMidi(key.midi)}
                onPointerDown={(event) => pointerDown(event, key.midi)}
                onPointerMove={pointerMove}
                onPointerUp={(event) => releaseNote(`pointer-${event.pointerId}`)}
                onPointerCancel={(event) => releaseNote(`pointer-${event.pointerId}`)}
                onLostPointerCapture={(event) => releaseNote(`pointer-${event.pointerId}`)}
                onClick={(event) => {
                  if (event.detail === 0) tapNote(key.midi);
                }}
              >
                <span className={styles.keyNote}>{key.note}</span>
                <kbd>{key.shortcut}</kbd>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.keyboardRanges} aria-label="移动可见音区">
          <button type="button" onClick={() => keyboardRef.current?.scrollBy({ left: -keyboardRef.current.clientWidth * 0.72, behavior: reducedRef.current ? 'instant' : 'smooth' })}>
            ← 低音
          </button>
          <span>移动琴键，探索不同音区</span>
          <button type="button" onClick={() => keyboardRef.current?.scrollBy({ left: keyboardRef.current.clientWidth * 0.72, behavior: reducedRef.current ? 'instant' : 'smooth' })}>
            高音 →
          </button>
        </div>

        <div className={styles.keyboardFooter}>
          <p id={`${id}-keyboard-help`}>
            电脑键 Z—M / Q—I 对应两组音区；方向键选择，回车弹奏。<span>小屏可在琴键下方横向滑动。</span>
          </p>
          <span aria-hidden="true">← 低音 / 高音 →</span>
        </div>
        <p className={styles.status} role="status" aria-live="polite">
          {status}
        </p>
      </div>

      <footer className={styles.credits}>
        <span>真实钢琴采样 · Salamander Grand Piano</span>
        <span>
          Alexander Holm ·{' '}
          <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
            CC BY 3.0
          </a>
          <a href="https://github.com/Tonejs/audio/tree/master/salamander" target="_blank" rel="noreferrer">
            音源 ↗
          </a>
        </span>
      </footer>
    </section>
  );
}
