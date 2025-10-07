import { useEffect, useMemo, useState } from "react";
import { ChordDrone, Quality, SEMITONES, CHORDS } from "./audio/ChordDrone";

const ROOTS = SEMITONES;
const QUALITIES: { label: string; value: Quality }[] = Object.keys(CHORDS).map(k => ({label: k, value: k as Quality}));

export default function App() {
  const drone = useMemo(() => new ChordDrone(), []);
  const [root, setRoot] = useState("C");
  const [quality, setQuality] = useState<Quality>("maj7");
  const [octave, setOctave] = useState(4);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const handler = () => drone.resume();
    window.addEventListener("touchend", handler, { passive: true });
    return () => window.removeEventListener("touchend", handler);
  }, [drone]);

  const enableAudio = async () => { await drone.resume(); setEnabled(true); };
  const start = () => { drone.play(root, quality, octave); };
  const stop = () => { drone.stopAll(); };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Chord Drone (Minimal)</h1>

      <div style={{ display:"grid", gap: 12, gridTemplateColumns:"1fr 1fr" }}>
        <label>Root<br/>
          <select value={root} onChange={e=>setRoot(e.target.value)}>
            {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>Octave<br/>
          <select value={octave} onChange={e=>setOctave(Number(e.target.value))}>
            {[3,4,5].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label style={{ gridColumn: "1 / span 2" }}>Quality<br/>
          <select value={quality} onChange={e=>setQuality(e.target.value as Quality)}>
            {QUALITIES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
          </select>
        </label>
      </div>

      <div style={{ marginTop: 16, display:"flex", gap: 10, flexWrap:"wrap" }}>
        <button onClick={enableAudio} disabled={enabled}>{enabled ? "Audio Ready ✔︎" : "Enable Audio"}</button>
        <button onClick={start} disabled={!enabled}>Start</button>
        <button onClick={stop}>Stop</button>
      </div>

      <p style={{opacity:0.65, marginTop:16}}>Tap Enable Audio once on mobile, then Start/Stop.</p>
    </div>
  );
}
