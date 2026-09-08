const sampleFiles = [
  { midi: 60, file: 'C4.mp3' },
  { midi: 63, file: 'Ds4.mp3' },
  { midi: 66, file: 'Fs4.mp3' },
  { midi: 69, file: 'A4.mp3' },
  { midi: 72, file: 'C5.mp3' },
  { midi: 75, file: 'Ds5.mp3' },
  { midi: 78, file: 'Fs5.mp3' },
  { midi: 84, file: 'C6.mp3' },
];

// Salamander Grand Piano recordings: Alexander Holm, CC BY 3.0.
// Attribution and upstream links live in /audio/piano/ATTRIBUTION.md.
export default class PianoSampler {
  constructor(volume = 0.65) {
    this.context = null;
    this.master = null;
    this.compressor = null;
    this.analyser = null;
    this.frequencyData = null;
    this.volume = volume;
    this.sustain = false;
    this.buffers = new Map();
    this.voices = new Map();
    this.serial = 0;
    this.loading = null;
    this.abort = null;
    this.loadTimer = null;
    this.loadGeneration = 0;
    this.cancelLoad = null;
    this.disposed = false;
  }

  get currentTime() {
    return this.context?.currentTime || 0;
  }

  get ready() {
    return this.buffers.size === sampleFiles.length;
  }

  async prepare() {
    if (this.disposed) throw new Error('钢琴已关闭');
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('当前浏览器不支持琴声，请使用新版 Chrome 或 Safari');
      this.context = new AudioContextClass({ latencyHint: 'interactive' });
      this.master = this.context.createGain();
      this.master.gain.value = this.volume * 0.72;
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -15;
      this.compressor.knee.value = 16;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.18;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.78;
      this.analyser.minDecibels = -82;
      this.analyser.maxDecibels = -20;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.master.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }

    // Resume is called in the original gesture turn, before awaiting any fetch.
    const resumed = this.context.state === 'suspended' ? this.context.resume() : Promise.resolve();
    if (!this.ready && !this.loading) {
      const controller = new AbortController();
      const { signal } = controller;
      this.loadGeneration += 1;
      const generation = this.loadGeneration;
      this.abort = controller;
      const samples = Promise.all(
        sampleFiles.map(async (sample) => {
          if (this.buffers.has(sample.midi)) return;
          const response = await fetch(`/audio/piano/${sample.file}`, { signal });
          if (!response.ok) throw new Error('琴声未能载入，请点击重试');
          const bytes = await response.arrayBuffer();
          const buffer = await this.context.decodeAudioData(bytes);
          if (!this.disposed && !signal.aborted && generation === this.loadGeneration) this.buffers.set(sample.midi, buffer);
        }),
      );
      let timer;
      const interruption = new Promise((resolve, reject) => {
        this.cancelLoad = (error) => {
          reject(error);
          controller.abort();
        };
        timer = setTimeout(() => {
          if (generation === this.loadGeneration) this.cancelLoad?.(new Error('琴声载入超时，请点击重试。'));
        }, 12000);
        this.loadTimer = timer;
      });
      this.loading = Promise.race([samples, interruption]).finally(() => {
        clearTimeout(timer);
        controller.abort();
        if (generation === this.loadGeneration) {
          this.loading = null;
          this.cancelLoad = null;
          this.loadTimer = null;
          this.abort = null;
        }
      });
    }
    await Promise.all([resumed, this.loading]);
    if (this.disposed) throw new Error('钢琴已关闭');
    return this;
  }

  cancelPreparation() {
    if (!this.loading) return false;
    const error = new Error('琴声载入已取消');
    error.name = 'AbortError';
    this.cancelLoad?.(error);
    this.loadGeneration += 1;
    clearTimeout(this.loadTimer);
    this.loading = null;
    this.cancelLoad = null;
    this.loadTimer = null;
    this.abort = null;
    return true;
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    this.master?.gain.setTargetAtTime(this.volume * 0.72, this.currentTime, 0.025);
  }

  setSustain(value) {
    this.sustain = value;
    if (!value)
      this.voices.forEach((voice) => {
        if (voice.pedalHeld) this.release(voice.id, this.currentTime, 0.35);
      });
  }

  noteOn(midi, { time = this.currentTime + 0.004, velocity = 0.78, duration = null } = {}) {
    if (!this.ready || this.disposed) return null;
    // A hard cap also bounds rapid repeated notes with the sustain pedal held.
    // Retiring a voice immediately avoids repeatedly extending its release time.
    if (this.voices.size >= 36) {
      const oldest = this.voices.values().next().value;
      oldest.source.onended = null;
      oldest.source.stop(this.currentTime);
      oldest.source.disconnect();
      oldest.envelope.disconnect();
      this.voices.delete(oldest.id);
    }
    const sample = sampleFiles.reduce((nearest, candidate) => (Math.abs(candidate.midi - midi) < Math.abs(nearest.midi - midi) ? candidate : nearest));
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(sample.midi);
    source.playbackRate.value = 2 ** ((midi - sample.midi) / 12);
    const envelope = this.context.createGain();
    const at = Math.max(time, this.currentTime);
    const level = Math.min(0.95, Math.max(0.1, velocity));
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(level, at + 0.008);
    source.connect(envelope);
    envelope.connect(this.master);
    this.serial += 1;
    const voice = { id: this.serial, midi, source, envelope, level, startsAt: at, offAt: Infinity, pedalHeld: false };
    this.voices.set(voice.id, voice);
    source.onended = () => {
      this.voices.delete(voice.id);
      source.disconnect();
      envelope.disconnect();
    };
    source.start(at);
    if (duration !== null) this.release(voice.id, at + duration, 0.26);
    return voice.id;
  }

  noteOff(id) {
    const voice = this.voices.get(id);
    if (!voice) return;
    voice.offAt = this.currentTime;
    if (this.sustain) voice.pedalHeld = true;
    else this.release(id, this.currentTime, 0.2);
  }

  release(id, time = this.currentTime, tail = 0.2) {
    const voice = this.voices.get(id);
    if (!voice) return;
    const at = Math.max(time, this.currentTime, voice.startsAt + 0.01);
    voice.offAt = at;
    voice.pedalHeld = false;
    voice.envelope.gain.cancelScheduledValues(at);
    voice.envelope.gain.setValueAtTime(voice.level, at);
    voice.envelope.gain.exponentialRampToValueAtTime(0.0001, at + tail);
    voice.source.stop(at + tail + 0.02);
  }

  activeNotes() {
    const now = this.currentTime;
    return [...new Set([...this.voices.values()].filter((voice) => voice.startsAt <= now && voice.offAt > now).map((voice) => voice.midi))];
  }

  spectrum(count) {
    if (!this.analyser) return Array(count).fill(0);
    this.analyser.getByteFrequencyData(this.frequencyData);
    const hzPerBin = this.context.sampleRate / this.analyser.fftSize;
    return Array.from({ length: count }, (_, index) => {
      const frequency = 110 * (4200 / 110) ** (index / (count - 1));
      const bin = Math.min(this.frequencyData.length - 2, Math.round(frequency / hzPerBin));
      return Math.max(this.frequencyData[bin], this.frequencyData[bin + 1]) / 255;
    });
  }

  stopAll() {
    const now = this.currentTime;
    this.voices.forEach((voice) => {
      voice.offAt = now;
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setTargetAtTime(0.0001, now, 0.009);
      voice.source.stop(now + 0.045);
    });
  }

  dispose() {
    this.disposed = true;
    this.cancelPreparation();
    this.stopAll();
    this.voices.forEach((voice) => {
      voice.source.onended = null;
      voice.source.disconnect();
      voice.envelope.disconnect();
    });
    this.voices.clear();
    this.buffers.clear();
    this.master?.disconnect();
    this.compressor?.disconnect();
    this.analyser?.disconnect();
    if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
  }
}
