'use strict';
/* Sound, synthesised in the browser — off until the viewer turns it on.
   Beds (drone, warm, rumble, rain, wind) follow each plate's mood(t); one-shots fire
   from each plate's sfx list as the playhead crosses them. Nothing is sampled or fetched.
   The same instrument renders offline (renderOffline) for the video export. */
(function () {
  const FILM = window.FILM, K = FILM.K;
  const MASTER = 0.85;
  const BED_SCALE = { drone: 0.2, warm: 0.18, rumble: 0.9, rain: 0.13, wind: 0.16 };

  /** Build the whole instrument on an AudioContext — live or offline. rnd picks the small
      variations (which chime note, where a noise burst starts). */
  function makeEngine(ac, rnd = Math.random) {
    function noiseBuffer(kind) {
      const len = ac.sampleRate * 3, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = rnd() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else d[i] = w;
      }
      return buf;
    }
    function loop(buf) { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
    function gain(v = 0) { const g = ac.createGain(); g.gain.value = v; return g; }
    function filter(type, f, q = 0.7) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }
    function osc(type, f, detune = 0) { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.start(); return o; }

    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    const master = gain(0);
    master.connect(comp).connect(ac.destination);
    const white = noiseBuffer('white'), brown = noiseBuffer('brown');

    // drone: an open fifth, low and slow-beating
    const drone = gain(0), dlp = filter('lowpass', 380, 0.4);
    dlp.connect(drone).connect(master);
    [[55, 0, 'sawtooth'], [55, 7, 'sawtooth'], [82.4, -5, 'triangle'], [110, 3, 'sine']].forEach(([f, dt, ty]) => { const o = osc(ty, f, dt), g = gain(0.22); o.connect(g).connect(dlp); });
    // warm: a major chord pad with a breathing tremolo
    const warm = gain(0), trem = gain(0.7), lfo = osc('sine', 0.23), lfoAmt = gain(0.3);
    lfo.connect(lfoAmt).connect(trem.gain);
    trem.connect(warm).connect(master);
    [220, 277.18, 329.63, 440].forEach((f, i) => { const o = osc('sine', f, i * 2 - 3), g = gain(0.12 / (1 + i * 0.4)); o.connect(g).connect(trem); });
    // rumble: brown noise, low-passed, rolling
    const rumble = gain(0), rlp = filter('lowpass', 95, 0.9), roll = osc('sine', 0.37), rollAmt = gain(0.35), rollG = gain(0.65);
    roll.connect(rollAmt).connect(rollG.gain);
    loop(brown).connect(rlp).connect(rollG).connect(rumble).connect(master);
    // rain: bright hiss
    const rain = gain(0), rbp = filter('bandpass', 2600, 0.5), rhp = filter('highpass', 700);
    loop(white).connect(rhp).connect(rbp).connect(rain).connect(master);
    // wind: swept band of noise
    const wind = gain(0), wbp = filter('bandpass', 520, 1.4), sweep = osc('sine', 0.11), sweepAmt = gain(260);
    sweep.connect(sweepAmt).connect(wbp.frequency);
    loop(white).connect(wbp).connect(wind).connect(master);
    const beds = { drone: [drone, BED_SCALE.drone], warm: [warm, BED_SCALE.warm], rumble: [rumble, BED_SCALE.rumble], rain: [rain, BED_SCALE.rain], wind: [wind, BED_SCALE.wind] };

    // ---------------------------------------------------------------- one-shots
    function env(g, t0, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    }
    function burst(buf, t0, dur, type, f, q, peak, a = 0.005) {
      const s = ac.createBufferSource(); s.buffer = buf;
      const b = filter(type, f, q), g = gain(0);
      s.connect(b).connect(g).connect(master);
      env(g, t0, a, peak, dur);
      s.start(t0, rnd() * 2); s.stop(t0 + a + dur + 0.1);
      return b;
    }
    function tone(t0, f, dur, peak, type = 'sine', f1 = null) {
      const o = ac.createOscillator(), g = gain(0);
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      o.connect(g).connect(master);
      env(g, t0, 0.004, peak, dur);
      o.start(t0); o.stop(t0 + dur + 0.1);
    }
    const PENTA = [659.25, 739.99, 880, 987.77, 1108.73];
    const sfx = {
      chime(t0) { const f = PENTA[(rnd() * PENTA.length) | 0]; tone(t0, f, 2.6, 0.05); tone(t0, f * 2.76, 1.4, 0.018); tone(t0, f * 5.4, 0.7, 0.008); },
      heart(t0) { tone(t0, 95, 0.16, 0.22, 'sine', 42); tone(t0 + 0.22, 85, 0.14, 0.14, 'sine', 40); },
      snap(t0) { burst(white, t0, 0.07, 'highpass', 2200, 0.7, 0.3); tone(t0, 1300, 0.22, 0.06, 'triangle', 260); },
      tick(t0) { burst(white, t0, 0.018, 'bandpass', 4200, 3, 0.12, 0.001); },
      stamp(t0) { tone(t0, 72, 0.4, 0.35, 'sine', 34); burst(white, t0, 0.22, 'lowpass', 420, 0.8, 0.35); burst(white, t0 + 0.01, 0.05, 'bandpass', 1500, 2, 0.12); },
      coin(t0) { const k = 0.9 + rnd() * 0.25; [2100, 2760, 3920, 5230].forEach((f, i) => tone(t0, f * k, 0.5 - i * 0.08, 0.035 / (1 + i))); burst(white, t0, 0.02, 'highpass', 6000, 0.7, 0.05, 0.001); },
      thunder(t0) {
        burst(white, t0, 0.35, 'highpass', 900, 0.5, 0.55, 0.002);
        burst(white, t0 + 0.02, 0.9, 'lowpass', 2400, 0.4, 0.4, 0.004);
        const lp = burst(brown, t0 + 0.05, 5.5, 'lowpass', 260, 0.6, 1.0, 0.08);
        lp.frequency.setValueAtTime(260, t0); lp.frequency.exponentialRampToValueAtTime(70, t0 + 5);
        for (let i = 0; i < 7; i++) burst(brown, t0 + 0.4 + rnd() * 3, 0.6 + rnd(), 'lowpass', 180, 0.5, 0.35 * rnd() + 0.15, 0.05);
      },
      crackle(t0) { for (let i = 0; i < 14; i++) burst(white, t0 + rnd() * 1.1, 0.012, 'highpass', 3000, 0.7, 0.05 + rnd() * 0.08, 0.001); },
      whoosh(t0) { const b = burst(white, t0, 1.1, 'bandpass', 300, 1.2, 0.16, 0.45); b.frequency.setValueAtTime(300, t0); b.frequency.exponentialRampToValueAtTime(1900, t0 + 0.55); b.frequency.exponentialRampToValueAtTime(350, t0 + 1.4); },
      hiss(t0) { burst(white, t0, 1.3, 'highpass', 4800, 0.7, 0.09, 0.02); },
    };
    return { ac, master, beds, sfx, buffers: { white, brown } };
  }

  // ---------------------------------------------------------------- following the film
  function moodAt(T) {
    const ORDER = FILM.ORDER;
    let s = ORDER[0];
    for (const o of ORDER) if (T >= o.start) s = o;
    const sc = FILM.scenes[s.id], t = T - s.start;
    if (sc && sc.mood) return sc.mood(t);
    const tone = sc && (typeof sc.tone === 'function' ? sc.tone(t) : sc.tone);
    return tone === 'paper' ? { drone: 0.35, warm: 0.5 } : { drone: 0.7, warm: 0.15 };
  }
  /** Every cue whose global time lies in (a, b], played now on engine e. */
  function fire(e, a, b) {
    for (const s of FILM.ORDER) {
      const sc = FILM.scenes[s.id];
      if (!sc || !sc.sfx) continue;
      for (const c of sc.sfx) {
        const g = s.start + c.at;
        if (g > a && g <= b && e.sfx[c.kind]) { try { e.sfx[c.kind](e.ac.currentTime + 0.02, c); } catch (err) { /* a missed cue is never worth a crash */ } }
      }
    }
  }

  let eng = null, on = false, playing = true;
  const lerpMood = { drone: 0, warm: 0, rumble: 0, rain: 0, wind: 0 };

  FILM.audio = {
    enable(T, isPlaying) {
      try {
        if (!eng) {
          eng = makeEngine(new (window.AudioContext || window.webkitAudioContext)());
          FILM.audioBuffers = eng.buffers;
        }
        eng.ac.resume();
        on = true;
        playing = isPlaying;
        eng.master.gain.cancelScheduledValues(eng.ac.currentTime);
        eng.master.gain.setTargetAtTime(playing ? MASTER : 0, eng.ac.currentTime, 0.4);
      } catch (e) { on = false; }
    },
    disable() {
      on = false;
      if (!eng) return;
      eng.master.gain.setTargetAtTime(0, eng.ac.currentTime, 0.15);
      setTimeout(() => { if (!on && eng) eng.ac.suspend(); }, 700);
    },
    setPlaying(v) {
      playing = v;
      if (!on || !eng) return;
      eng.master.gain.setTargetAtTime(v ? MASTER : 0, eng.ac.currentTime, v ? 0.3 : 0.1);
    },
    jump() { /* scrubbing: beds follow on the next update; cues between are skipped */ },
    update(T, prevT, isPlaying) {
      if (!on || !eng || !isPlaying) return;
      const m = moodAt(T), now = eng.ac.currentTime;
      for (const k in eng.beds) {
        const [g, scale] = eng.beds[k];
        const v = K.clamp(m[k] || 0) * scale;
        if (Math.abs(v - lerpMood[k]) > 0.002) { g.gain.setTargetAtTime(v, now, 0.35); lerpMood[k] = v; }
      }
      const d = T - prevT;
      if (d > 0 && d < 0.5) fire(eng, prevT, T);
      else if (d < 0 && prevT > FILM.TOTAL - 0.5 && T < 0.5) { fire(eng, prevT, FILM.TOTAL); fire(eng, -1, T); } // the loop seam
    },
    /** The whole soundtrack, start to finish, on its own offline instrument (the live one is untouched). */
    renderOffline({ rate = 48000 } = {}) {
      const total = FILM.TOTAL, oac = new OfflineAudioContext(2, Math.ceil(total * rate), rate);
      const e = makeEngine(oac, K.mulberry(7));
      e.master.gain.value = MASTER;
      // beds follow the film's mood, sampled at 20 Hz
      for (let i = 0; i <= total * 20; i++) {
        const T = i / 20, m = moodAt(Math.min(T, total - 1e-6));
        for (const k in e.beds) { const [g, scale] = e.beds[k]; g.gain.setTargetAtTime(K.clamp(m[k] || 0) * scale, T, 0.35); }
      }
      // every cue at its place on the timeline
      for (const s of FILM.ORDER) {
        const sc = FILM.scenes[s.id];
        if (!sc || !sc.sfx) continue;
        for (const c of sc.sfx) if (e.sfx[c.kind]) e.sfx[c.kind](s.start + c.at, c);
      }
      return oac.startRendering();
    },
  };
})();
