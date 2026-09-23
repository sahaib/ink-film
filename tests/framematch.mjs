// Review Focus 4 (export drift): the video's frame at time t must be the frame renderAt(t) draws.
//   node framematch.mjs <video.mp4> <t> <renderAt(t).png> <control.png>
// Decodes the frame at t (BT.709, limited range, as the export tags it) and prints its mean |Δ| per
// channel against the direct render and against a control render at another moment. Passes when the
// direct render is under 3/255 and nearer than the control. FFMPEG names ffmpeg (default: on PATH).
import { spawnSync } from 'node:child_process';

const [video, t, direct, control] = process.argv.slice(2);
if (!video || !t || !direct || !control) { console.error('usage: node framematch.mjs <video.mp4> <t> <renderAt(t).png> <control.png>'); process.exit(2); }
const FF = process.env.FFMPEG || 'ffmpeg';
const rgb = (args) => {
  const r = spawnSync(FF, ['-hide_banner', '-nostdin', '-loglevel', 'error', ...args, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) { console.error(`ffmpeg failed: ${r.stderr}`); process.exit(1); }
  return r.stdout;
};
const mad = (a, b) => {
  if (a.length !== b.length) { console.error(`frame sizes differ: ${a.length} vs ${b.length} bytes`); process.exit(1); }
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
};
const dec = 'scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int+full_chroma_inp,format=rgb24';
const frame = rgb(['-ss', t, '-i', video, '-vf', dec, '-frames:v', '1']);
const d = mad(frame, rgb(['-i', direct])), c = mad(frame, rgb(['-i', control]));
const ok = d < 3 && c > d;
console.log(`${ok ? 'PASS' : 'FAIL'}  Review Focus 4 (export drift): mean |Δ| of the video's frame at ${t} s is ${d.toFixed(2)}/255 against renderAt(${t}) (limit 3), ${c.toFixed(2)}/255 against the control`);
process.exit(ok ? 0 : 1);
