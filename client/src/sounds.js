let _ctx = null;
let _muted = localStorage.getItem("pondre_muted") === "true";

function ctx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function tone(freq, dur, type = "sine", vol = 0.25, when = 0) {
  if (_muted) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = c.currentTime + when;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {}
}

export function playWordReveal() {
  tone(660, 0.1, "sine", 0.2);
}

export function playChoicesReveal() {
  tone(440, 0.08, "sine", 0.18);
  tone(550, 0.08, "sine", 0.18, 0.07);
}

export function playCorrect() {
  tone(523, 0.12, "sine", 0.3);
  tone(659, 0.12, "sine", 0.3, 0.1);
  tone(784, 0.22, "sine", 0.3, 0.2);
}

export function playWrong() {
  if (_muted) return;
  try {
    const c = ctx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    osc.start();
    osc.stop(c.currentTime + 0.35);
  } catch {}
}

export function playCountdownTick() {
  tone(880, 0.06, "square", 0.12);
}

export function playGameStart() {
  [262, 330, 392, 523].forEach((f, i) => tone(f, 0.2, "sine", 0.28, i * 0.1));
}

export function playWin() {
  [523, 523, 784, 659, 784, 1047].forEach((f, i) =>
    tone(f, 0.18, "sine", 0.3, i * 0.12)
  );
}

export function playLose() {
  [392, 349, 311, 294].forEach((f, i) =>
    tone(f, 0.22, "sine", 0.22, i * 0.14)
  );
}

export function playChat() {
  tone(1100, 0.06, "sine", 0.08);
}

export function playPlayerJoin() {
  tone(440, 0.08, "sine", 0.12);
  tone(660, 0.08, "sine", 0.12, 0.09);
}

export function isMuted() {
  return _muted;
}

export function toggleMute() {
  _muted = !_muted;
  localStorage.setItem("pondre_muted", String(_muted));
  return _muted;
}
