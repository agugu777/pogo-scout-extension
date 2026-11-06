chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "POGO_SCOUT_PLAY_SOUND") return;
  playSound(message.sound).then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: error?.message || "音效播放失敗。" })
  );
  return true;
});

let audioContext;
async function playSound(sound) {
  if (!["default", "soft", "chime"].includes(sound)) return;
  audioContext ||= new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();
  if (sound === "default") playDefaultTone(audioContext);
  else if (sound === "soft") playSoftTone(audioContext);
  else playChime(audioContext);
}

function playDefaultTone(context) {
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(0.1, start + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.22);
}

function playSoftTone(context) {
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, start);
  oscillator.frequency.exponentialRampToValueAtTime(520, start + 0.32);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.38);
}

function playChime(context) {
  const start = context.currentTime;
  playNote(context, 784, start, 0.24);
  playNote(context, 1046.5, start + 0.13, 0.34);
}

function playNote(context, frequency, start, duration) {
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(0.11, start + 0.018);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
