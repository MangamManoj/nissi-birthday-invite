/**
 * Generate a simple Happy Birthday instrumental WAV (melody + chords).
 * Public-domain melody. Run: node generate-bgm.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "audio", "happy-birthday.wav");

const SAMPLE_RATE = 44100;
const BPM_BEAT = 0.34; // seconds per beat unit used in score

const NOTE = {
  C3: 130.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
  REST: 0,
};

// [melodyHz, beats, chordRootHz or 0]
const score = [
  [NOTE.C4, 0.75, NOTE.F3],
  [NOTE.C4, 0.25, NOTE.F3],
  [NOTE.D4, 1, NOTE.F3],
  [NOTE.C4, 1, NOTE.F3],
  [NOTE.F4, 1, NOTE.F3],
  [NOTE.E4, 2, NOTE.C4],

  [NOTE.C4, 0.75, NOTE.F3],
  [NOTE.C4, 0.25, NOTE.F3],
  [NOTE.D4, 1, NOTE.F3],
  [NOTE.C4, 1, NOTE.F3],
  [NOTE.G4, 1, NOTE.C4],
  [NOTE.F4, 2, NOTE.F3],

  [NOTE.C4, 0.75, NOTE.F3],
  [NOTE.C4, 0.25, NOTE.F3],
  [NOTE.C5, 1, NOTE.Bb3],
  [NOTE.A4, 1, NOTE.Bb3],
  [NOTE.F4, 1, NOTE.F3],
  [NOTE.E4, 1, NOTE.C4],
  [NOTE.D4, 2, NOTE.C4],

  [NOTE.Bb4, 0.75, NOTE.Bb3],
  [NOTE.Bb4, 0.25, NOTE.Bb3],
  [NOTE.A4, 1, NOTE.F3],
  [NOTE.F4, 1, NOTE.F3],
  [NOTE.G4, 1, NOTE.C4],
  [NOTE.F4, 2, NOTE.F3],

  [NOTE.REST, 1.2, 0],
];

function chordTones(root) {
  if (!root) return [];
  // major triad: root, third (~5/4), fifth (3/2)
  return [root, root * 1.25, root * 1.5];
}

function writeWav(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log("Wrote", outPath, `(${(buffer.length / 1024).toFixed(1)} KB)`);
}

const samples = [];
let t = 0;

for (const [freq, beats, bass] of score) {
  const dur = beats * BPM_BEAT;
  const n = Math.floor(dur * SAMPLE_RATE);
  const chords = chordTones(bass);

  for (let i = 0; i < n; i++) {
    const localT = i / SAMPLE_RATE;
    const env =
      Math.min(1, localT / 0.02) *
      Math.max(0, 1 - Math.max(0, localT - (dur - 0.08)) / 0.08);

    let v = 0;
    if (freq) {
      v += 0.38 * Math.sin(2 * Math.PI * freq * (t + localT)) * env;
      v += 0.12 * Math.sin(2 * Math.PI * freq * 2 * (t + localT)) * env;
    }
    for (const c of chords) {
      v += 0.09 * Math.sin(2 * Math.PI * c * (t + localT)) * env;
    }
    if (bass) {
      v += 0.16 * Math.sin(2 * Math.PI * (bass / 2) * (t + localT)) * env;
    }
    // soft sparkle
    if (freq) {
      v += 0.04 * Math.sin(2 * Math.PI * freq * 3 * (t + localT)) * env;
    }
    samples.push(v * 0.85);
  }
  t += dur;
}

writeWav(samples);
