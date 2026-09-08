const pitchNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const computerKeys = [
  'KeyZ',
  'KeyS',
  'KeyX',
  'KeyD',
  'KeyC',
  'KeyV',
  'KeyG',
  'KeyB',
  'KeyH',
  'KeyN',
  'KeyJ',
  'KeyM',
  'KeyQ',
  'Digit2',
  'KeyW',
  'Digit3',
  'KeyE',
  'KeyR',
  'Digit5',
  'KeyT',
  'Digit6',
  'KeyY',
  'Digit7',
  'KeyU',
  'KeyI',
];

export const noteName = (midi) => `${pitchNames[midi % 12]}${Math.floor(midi / 12) - 1}`;

let whitePosition = 0;
export const pianoKeys = Array.from({ length: 25 }, (_, index) => {
  const midi = 60 + index;
  const black = [1, 3, 6, 8, 10].includes(midi % 12);
  const position = black ? whitePosition - 0.32 : whitePosition;
  if (!black) whitePosition += 1;
  return { midi, note: noteName(midi), black, position, code: computerKeys[index], shortcut: computerKeys[index].replace('Key', '').replace('Digit', '') };
});

export const keyboardNotes = Object.fromEntries(pianoKeys.map((key) => [key.code, key.midi]));

const midiFromName = (name) => {
  const match = name.match(/^([A-G])(#?)([4-6])$/);
  const semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return (Number(match[3]) + 1) * 12 + semitones[match[1]] + (match[2] ? 1 : 0);
};

function makeScore(id, title, composer, bpm, melody, bass = []) {
  const secondsPerBeat = 60 / bpm;
  let beat = 0;
  const events = melody.map(([note, length = 1]) => {
    const event = { midi: midiFromName(note), time: beat * secondsPerBeat, duration: length * secondsPerBeat * 0.88, velocity: 0.76 };
    beat += length;
    return event;
  });
  const melodyEvents = [...events];
  bass.forEach(([note, at, length = 2]) => events.push({ midi: midiFromName(note), time: at * secondsPerBeat, duration: length * secondsPerBeat * 0.85, velocity: 0.38 }));
  events.sort((first, second) => first.time - second.time);
  const duration = Math.max(beat * secondsPerBeat, ...events.map((event) => event.time + event.duration));
  return { id, title, composer, bpm, beatsPerBar: id === 'elise' ? 3 : 4, events, melodyEvents, duration, seconds: Math.ceil(duration) };
}

export const recordingLimit = 30;
export const recordingNoteLimit = 256;

export const createFollowSteps = (score) =>
  score.melodyEvents.map((event, index) => ({ midi: event.midi, note: noteName(event.midi), shortcut: pianoKeys.find((key) => key.midi === event.midi).shortcut, index }));

// Only local note events are recorded. No microphone, media stream or network data.
export class PianoTakeRecorder {
  constructor({ startedAt, limit = recordingLimit, maxNotes = recordingNoteLimit }) {
    if (!Number.isFinite(startedAt) || !Number.isFinite(limit) || limit <= 0 || !Number.isInteger(maxNotes) || maxNotes <= 0) throw new Error('Invalid recording limits');
    this.startedAt = startedAt;
    this.limit = limit;
    this.maxNotes = maxNotes;
    this.events = [];
    this.pressed = new Map();
    this.pedalHeld = new Set();
    this.sustain = false;
    this.result = null;
  }

  get count() {
    return this.events.length;
  }

  elapsed(time) {
    return Number.isFinite(time) ? Math.min(this.limit, Math.max(0, time - this.startedAt)) : 0;
  }

  reachedLimit(time) {
    return this.elapsed(time) >= this.limit || this.count >= this.maxNotes;
  }

  noteDown(token, midi, time, velocity = 0.78) {
    if (this.result || !Number.isFinite(time) || time < this.startedAt || this.elapsed(time) > this.limit - 0.04 || this.count >= this.maxNotes || this.pressed.has(token)) return false;
    if (!Number.isInteger(midi) || midi < 60 || midi > 84 || !Number.isFinite(velocity)) return false;
    const event = { midi, time: this.elapsed(time), duration: null, velocity: Math.min(0.95, Math.max(0.1, velocity)) };
    this.events.push(event);
    this.pressed.set(token, event);
    return true;
  }

  closeNote(event, time) {
    const end = Math.max(event.time + 0.04, this.elapsed(time));
    event.duration = Math.min(this.limit - event.time, end - event.time);
  }

  noteUp(token, time, { ignoreSustain = false } = {}) {
    if (this.result || !Number.isFinite(time)) return;
    const event = this.pressed.get(token);
    if (!event) return;
    this.pressed.delete(token);
    if (this.sustain && !ignoreSustain) this.pedalHeld.add(event);
    else this.closeNote(event, time);
  }

  setSustain(value, time) {
    if (this.result || !Number.isFinite(time)) return;
    this.sustain = Boolean(value);
    if (!value) {
      this.pedalHeld.forEach((event) => this.closeNote(event, time));
      this.pedalHeld.clear();
    }
  }

  finish(time) {
    if (this.result) return this.result;
    const end = this.elapsed(time);
    this.pressed.forEach((event) => this.closeNote(event, time));
    this.pedalHeld.forEach((event) => this.closeNote(event, time));
    this.pressed.clear();
    this.pedalHeld.clear();
    const first = this.events[0]?.time || 0;
    const events = this.events.map((event) => ({
      ...event,
      time: event.time - first,
      duration: Math.max(0.04, Math.min(event.duration, Math.max(0.04, end - event.time))),
    }));
    const duration = events.length ? Math.max(...events.map((event) => event.time + event.duration)) : 0;
    this.result = { events, duration, count: events.length };
    return this.result;
  }
}

export const pianoPresets = [
  makeScore(
    'joy',
    '欢乐颂',
    '贝多芬 · 主题',
    104,
    [
      ['E5'],
      ['E5'],
      ['F5'],
      ['G5'],
      ['G5'],
      ['F5'],
      ['E5'],
      ['D5'],
      ['C5'],
      ['C5'],
      ['D5'],
      ['E5'],
      ['E5', 1.5],
      ['D5', 0.5],
      ['D5', 2],
      ['E5'],
      ['E5'],
      ['F5'],
      ['G5'],
      ['G5'],
      ['F5'],
      ['E5'],
      ['D5'],
      ['C5'],
      ['C5'],
      ['D5'],
      ['E5'],
      ['D5', 1.5],
      ['C5', 0.5],
      ['C5', 2],
    ],
    [
      ['C4', 0],
      ['G4', 4],
      ['C4', 8],
      ['G4', 12],
      ['C4', 16],
      ['G4', 20],
      ['F4', 24],
      ['C4', 28],
    ],
  ),
  makeScore(
    'star',
    '小星星',
    '传统旋律 · 主题',
    106,
    [
      ['C5'],
      ['C5'],
      ['G5'],
      ['G5'],
      ['A5'],
      ['A5'],
      ['G5', 2],
      ['F5'],
      ['F5'],
      ['E5'],
      ['E5'],
      ['D5'],
      ['D5'],
      ['C5', 2],
      ['G5'],
      ['G5'],
      ['F5'],
      ['F5'],
      ['E5'],
      ['E5'],
      ['D5', 2],
      ['G5'],
      ['G5'],
      ['F5'],
      ['F5'],
      ['E5'],
      ['E5'],
      ['D5', 2],
      ['C5'],
      ['C5'],
      ['G5'],
      ['G5'],
      ['A5'],
      ['A5'],
      ['G5', 2],
      ['F5'],
      ['F5'],
      ['E5'],
      ['E5'],
      ['D5'],
      ['D5'],
      ['C5', 2],
    ],
    [
      ['C4', 0],
      ['F4', 4],
      ['F4', 8],
      ['C4', 12],
      ['G4', 16],
      ['C4', 20],
      ['G4', 24],
      ['G4', 28],
      ['C4', 32],
      ['F4', 36],
      ['G4', 40],
      ['C4', 44],
    ],
  ),
  makeScore('elise', '致爱丽丝', '贝多芬 · 主题片段', 94, [
    ['E5', 0.5],
    ['D#5', 0.5],
    ['E5', 0.5],
    ['D#5', 0.5],
    ['E5', 0.5],
    ['B4', 0.5],
    ['D5', 0.5],
    ['C5', 0.5],
    ['A4', 1.5],
    ['C4', 0.5],
    ['E4', 0.5],
    ['A4', 0.5],
    ['B4', 1.5],
    ['E4', 0.5],
    ['G#4', 0.5],
    ['B4', 0.5],
    ['C5', 1.5],
    ['E4', 0.5],
    ['E5', 0.5],
    ['D#5', 0.5],
    ['E5', 0.5],
    ['D#5', 0.5],
    ['E5', 0.5],
    ['B4', 0.5],
    ['D5', 0.5],
    ['C5', 0.5],
    ['A4', 1.5],
    ['C4', 0.5],
    ['E4', 0.5],
    ['A4', 0.5],
    ['B4', 1.5],
    ['E4', 0.5],
    ['C5', 0.5],
    ['B4', 0.5],
    ['A4', 2],
  ]),
];
