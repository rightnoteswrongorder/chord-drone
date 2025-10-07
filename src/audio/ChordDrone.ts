// Minimal chord drone with jazz extensions; Start/Stop only.
export type Quality =
  | "maj" | "min" | "dom7" | "maj7" | "min7"
  | "m7b5" | "dim" | "sus2" | "sus4" | "power" | "add9"
  | "maj6" | "maj69" | "maj9" | "maj7#11" | "maj7#5"
  | "9" | "11" | "13" | "7b9" | "7#9" | "7b5" | "7#5" | "7b9b13" | "7#11" | "7alt"
  | "7sus4" | "9sus4"
  | "min6" | "min69" | "min9" | "min11" | "min13" | "minMaj7" | "m9b5"
  | "dim7" | "aug";

const A4 = 440;
export const SEMITONES = ["C","C#/Db","D","D#/Eb","E","F","F#/Gb","G","G#/Ab","A","A#/Bb","B"];

export const CHORDS: Record<Quality, number[]> = {
  maj:   [0, 4, 7],
  min:   [0, 3, 7],
  dom7:  [0, 4, 7, 10],
  maj7:  [0, 4, 7, 11],
  min7:  [0, 3, 7, 10],
  m7b5:  [0, 3, 6, 10],
  dim:   [0, 3, 6],
  sus2:  [0, 2, 7],
  sus4:  [0, 5, 7],
  power: [0, 7],
  add9:  [0, 4, 7, 14],

  maj6:    [0, 4, 7, 9],
  maj69:   [0, 4, 7, 9, 14],
  maj9:    [0, 4, 7, 11, 14],
  "maj7#11": [0, 4, 7, 11, 18],
  "maj7#5":  [0, 4, 8, 11],

  "9":      [0, 4, 7, 10, 14],
  "11":     [0, 5, 7, 10, 17],
  "13":     [0, 4, 7, 10, 14, 21],
  "7b9":    [0, 4, 7, 10, 13],
  "7#9":    [0, 4, 7, 10, 15],
  "7b5":    [0, 4, 6, 10],
  "7#5":    [0, 4, 8, 10],
  "7b9b13": [0, 4, 7, 10, 13, 20],
  "7#11":   [0, 4, 7, 10, 18],
  "7alt":   [0, 4, 10, 13, 15, 6, 8],

  "7sus4": [0, 5, 7, 10],
  "9sus4": [0, 5, 10, 14],

  min6:    [0, 3, 7, 9],
  min69:   [0, 3, 7, 9, 14],
  min9:    [0, 3, 7, 10, 14],
  min11:   [0, 3, 7, 10, 14, 17],
  min13:   [0, 3, 7, 10, 14, 21],
  minMaj7: [0, 3, 7, 11],
  m9b5:    [0, 3, 6, 10, 14],

  dim7:    [0, 3, 6, 9],
  aug:     [0, 4, 8],
};

function midiToFreq(m: number) { return A4 * Math.pow(2, (m - 69) / 12); }
function noteToMidi(rootName: string, octave: number) {
  const idx = SEMITONES.indexOf(rootName);
  if (idx < 0) throw new Error("Bad note");
  return idx + (octave + 1) * 12;
}

type VoiceNode = { osc: OscillatorNode; gain: GainNode };

export class ChordDrone {
  ctx: AudioContext | null = null;
  out!: GainNode;
  lp!: BiquadFilterNode;
  convolver!: ConvolverNode;
  active: VoiceNode[] = [];

  ensure() {
    if (this.ctx) return;
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as any;
    this.ctx = new Ctor();
    const ctx = this.ctx!;

    this.out = ctx.createGain(); this.out.gain.value = 0.28;
    this.lp = ctx.createBiquadFilter(); this.lp.type = "lowpass"; this.lp.frequency.value = 3600;
    this.convolver = ctx.createConvolver(); this.convolver.buffer = this.makeSpringIR(1.1, 0.3);

    const dry = ctx.createGain(); const wet = ctx.createGain(); wet.gain.value = 0.14;
    dry.connect(this.out); wet.connect(this.out);
    const bus = ctx.createGain(); bus.connect(dry); bus.connect(this.convolver).connect(wet);
    this.lp.connect(bus);
    this.out.connect(ctx.destination);
  }

  async resume(){ this.ensure(); if (this.ctx!.state !== "running") await this.ctx!.resume(); }

  stopAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.active.forEach(v => { try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setTargetAtTime(0, now, 0.15);
      v.osc.stop(now + 0.25);
    } catch {} });
    this.active = [];
  }

  play(root: string, quality: Quality, octave: number = 4) {
    this.stopAll(); this.ensure();
    const ctx = this.ctx!;

    const base = noteToMidi(root, octave);
    const intervals = CHORDS[quality];
    const notes = intervals.map(s => base + s);
    const freqs = notes.map(m => midiToFreq(m));

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.value = f;
      g.gain.value = 0;
      osc.connect(g).connect(this.lp);
      const now = ctx.currentTime;
      g.gain.linearRampToValueAtTime(0.2 / freqs.length, now + 0.18);
      osc.start();
      this.active.push({ osc, gain: g });
    });
  }

  private makeSpringIR(seconds = 1.2, decay = 0.4) {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const len = Math.floor(seconds * rate);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        const env = Math.pow(1 - t / seconds, 3) * Math.exp(-decay * t);
        const noise = (Math.random() * 2 - 1) * 0.6;
        const chirp = Math.sin(2 * Math.PI * (1800 + 600 * t) * t) * 0.05;
        data[i] = (noise + chirp) * env;
      }
    }
    return buf;
  }
}
