const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

// Both the beat grid and note envelopes read AudioContext.currentTime. A delayed
// animation frame catches up to the audible position, rather than drifting.
export default class PianoRhythmClock {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.source = 'live';
    this.bpm = 0;
    this.beatsPerBar = 4;
    this.startsAt = 0;
    this.endsAt = Infinity;
    this.nextBeat = 0;
    this.beatIndex = -1;
    this.beatAt = -Infinity;
    this.noteAt = -Infinity;
    this.noteEnergy = 0;
    this.position = 0.5;
    this.queued = [];
  }

  start({ startsAt, duration, bpm = 0, beatsPerBar = 4, source = 'preset' }) {
    this.reset();
    this.active = true;
    this.startsAt = startsAt;
    this.endsAt = startsAt + duration;
    this.bpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 0;
    this.beatsPerBar = clamp(Math.round(beatsPerBar), 2, 6);
    this.source = source;
  }

  note(midi, time, velocity = 0.78) {
    if (!Number.isFinite(time)) return;
    if (!this.active) {
      this.reset();
      this.active = true;
      this.startsAt = time;
    }
    this.queued.push({ midi, time, velocity: clamp(velocity, 0, 1) });
    this.queued.sort((first, second) => first.time - second.time);
  }

  detail({ accent = false, energy = 0, kind = 'note', notes = [] } = {}) {
    return {
      active: this.active,
      beat: (Math.max(0, this.beatIndex) % this.beatsPerBar) + 1,
      accent,
      energy,
      bpm: this.bpm,
      source: this.source,
      kind,
      notes,
      beatsPerBar: this.beatsPerBar,
      absoluteBeat: this.beatIndex,
    };
  }

  sample(now) {
    const events = [];
    if (!this.active) return { active: false, events, beatPulse: 0, notePulse: 0, phase: 0, position: 0.5 };
    const period = this.bpm > 0 ? 60 / this.bpm : 0;
    const elapsed = Math.max(0, now - this.startsAt);
    let beatDetail = null;
    if (period && now >= this.startsAt && now < this.endsAt) {
      const currentBeat = Math.floor((elapsed + 0.000001) / period);
      if (currentBeat >= this.nextBeat) {
        this.beatIndex = currentBeat;
        this.beatAt = this.startsAt + currentBeat * period;
        this.nextBeat = currentBeat + 1;
        const accent = currentBeat % this.beatsPerBar === 0;
        // Never replay a burst of stale events after a blocked main thread.
        if (now - this.beatAt < 0.2) beatDetail = this.detail({ kind: 'beat', accent, energy: accent ? 1 : 0.58 });
      }
    }

    let notes = [];
    while (this.queued.length && this.queued[0].time <= now) {
      const note = this.queued.shift();
      if (note.time - this.noteAt > 0.035) notes = [];
      this.noteAt = note.time;
      this.noteEnergy = note.velocity;
      this.position = clamp((note.midi - 60) / 24, 0.06, 0.94);
      notes.push(note);
    }
    if (notes.length && now - this.noteAt < 0.2) {
      const leadingNote = notes.reduce((loudest, note) => (note.velocity > loudest.velocity ? note : loudest));
      this.noteEnergy = leadingNote.velocity;
      this.position = clamp((leadingNote.midi - 60) / 24, 0.06, 0.94);
      if (!period) {
        this.beatIndex += 1;
        this.beatAt = this.noteAt;
      }
      const pitches = [...new Set(notes.map((note) => note.midi))];
      if (beatDetail && Math.abs(this.noteAt - this.beatAt) < 0.045) beatDetail.notes = pitches;
      else events.push(this.detail({ kind: 'note', energy: this.noteEnergy, accent: this.noteEnergy >= 0.85, notes: pitches }));
    }
    if (beatDetail) events.unshift(beatDetail);
    const accent = this.beatIndex % this.beatsPerBar === 0;
    const beatPulse = period ? Math.exp(-Math.max(0, now - this.beatAt) * 7.5) * (accent ? 1 : 0.52) : 0;
    const notePulse = Math.exp(-Math.max(0, now - this.noteAt) * 9) * this.noteEnergy;
    return {
      active: true,
      events,
      beatPulse,
      notePulse,
      phase: period ? (elapsed % period) / period : 0,
      position: this.position,
      beat: this.beatIndex < 0 ? 0 : (this.beatIndex % this.beatsPerBar) + 1,
      accent,
    };
  }

  stop() {
    const wasActive = this.active;
    const detail = { ...this.detail(), active: false, energy: 0, accent: false, kind: 'stop' };
    this.reset();
    return wasActive ? detail : null;
  }
}
