/**
 * Nissita Mangam — first birthday web invite
 * Petal rain · ambient BGM · Maps / calendar / WhatsApp
 */

(function () {
  const BGM_VOLUME = 0.4;

  /* —— Petal rain —— */
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  let petals = [];
  let petalRaf = 0;
  let petalsPaused = false;
  const PETAL_COUNT = 28;

  const petalColors = [
    "rgba(255, 130, 160, 0.8)",
    "rgba(255, 210, 100, 0.75)",
    "rgba(255, 170, 140, 0.75)",
    "rgba(120, 200, 255, 0.65)",
    "rgba(255, 255, 255, 0.7)",
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function makePetal() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      r: 4 + Math.random() * 7,
      speed: 0.4 + Math.random() * 0.9,
      drift: -0.4 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      spin: -0.02 + Math.random() * 0.04,
      color: petalColors[(Math.random() * petalColors.length) | 0],
    };
  }

  function initPetals() {
    petals = Array.from({ length: PETAL_COUNT }, makePetal);
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r * 0.55, p.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tickPetals() {
    if (petalsPaused) {
      petalRaf = requestAnimationFrame(tickPetals);
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of petals) {
      p.y += p.speed;
      p.x += p.drift + Math.sin(p.y * 0.01) * 0.3;
      p.rot += p.spin;
      if (p.y > window.innerHeight + 20) {
        p.y = -20;
        p.x = Math.random() * window.innerWidth;
      }
      drawPetal(p);
    }
    petalRaf = requestAnimationFrame(tickPetals);
  }

  resizeCanvas();
  initPetals();
  tickPetals();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  /* —— Birthday instrumental BGM (Safari / iOS–safe unlock) —— */
  let audioCtx = null;
  let masterGain = null;
  let bgmStarted = false;
  let nextNoteTime = 0;
  let schedulerTimer = null;
  let unlockBound = false;

  const C4 = 261.63;
  const D4 = 293.66;
  const E4 = 329.63;
  const F4 = 349.23;
  const G4 = 392.0;
  const A4 = 440.0;
  const Bb4 = 466.16;
  const C5 = 523.25;
  const REST = 0;

  const melody = [
    [C4, 0.75], [C4, 0.25], [D4, 1], [C4, 1], [F4, 1], [E4, 2],
    [C4, 0.75], [C4, 0.25], [D4, 1], [C4, 1], [G4, 1], [F4, 2],
    [C4, 0.75], [C4, 0.25], [C5, 1], [A4, 1], [F4, 1], [E4, 1], [D4, 2],
    [Bb4, 0.75], [Bb4, 0.25], [A4, 1], [F4, 1], [G4, 1], [F4, 2],
    [REST, 1.5],
  ];
  let noteIndex = 0;
  const beat = 0.32;

  function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = BGM_VOLUME;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  }

  /** Must run inside a user-gesture call stack on Safari/iOS */
  function unlockAudioSync() {
    const ctx = ensureAudio();
    if (!ctx) return false;

    // Silent buffer unlock (iOS Safari)
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (_) {
      /* ignore */
    }

    // Tiny click also helps some WebKit builds
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(0);
      osc.stop(ctx.currentTime + 0.01);
    } catch (_) {
      /* ignore */
    }

    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return true;
  }

  function rampGain(gainParam, peak, time, attack, dur) {
    // linear ramps only — Safari dislikes exponential from 0
    gainParam.setValueAtTime(0.0001, time);
    gainParam.linearRampToValueAtTime(peak, time + attack);
    gainParam.linearRampToValueAtTime(0.0001, time + Math.max(attack + 0.02, dur));
  }

  function playTone(freq, time, dur) {
    if (!audioCtx || !masterGain || !freq) return;
    const attack = Math.min(0.04, dur * 0.15);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    rampGain(gain.gain, 0.85, time, attack, dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.08);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, time);
    rampGain(gain2.gain, 0.28, time, attack, dur);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(time);
    osc2.stop(time + dur + 0.08);

    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(freq * 3, time);
    rampGain(gain3.gain, 0.08, time, attack, dur * 0.85);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(time);
    osc3.stop(time + dur + 0.08);
  }

  function scheduleNotes() {
    if (!audioCtx || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    if (nextNoteTime < now) nextNoteTime = now + 0.02;
    const horizon = now + 0.25;
    while (nextNoteTime < horizon + 1.5) {
      const [freq, beats] = melody[noteIndex % melody.length];
      const dur = beats * beat;
      if (freq) {
        playTone(freq, nextNoteTime, dur * 0.92);
        if (beats >= 1) playTone(freq / 2, nextNoteTime, dur * 1.05);
      }
      nextNoteTime += dur;
      noteIndex++;
    }
  }

  function startScheduler() {
    if (!audioCtx) return;
    if (schedulerTimer) return;
    nextNoteTime = audioCtx.currentTime + 0.05;
    noteIndex = noteIndex % melody.length;
    scheduleNotes();
    schedulerTimer = setInterval(scheduleNotes, 180);
  }

  function stopScheduler() {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function startBgmFromGesture() {
    unlockAudioSync();
    if (!audioCtx) return;

    const finish = () => {
      if (audioCtx.state === "running" && !bgmStarted) {
        bgmStarted = true;
        startScheduler();
        detachUnlock();
      } else if (audioCtx.state === "running" && !schedulerTimer) {
        startScheduler();
        detachUnlock();
      }
    };

    if (audioCtx.state === "running") {
      finish();
      return;
    }

    // resume() may return a promise — still kick scheduler when it resolves
    const p = audioCtx.resume();
    if (p && typeof p.then === "function") {
      p.then(finish).catch(() => {});
    }
    // Also poll briefly — some iOS versions need a tick
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      if (audioCtx.state === "running") {
        clearInterval(poll);
        finish();
      } else if (tries > 20) {
        clearInterval(poll);
      }
    }, 50);
  }

  function unlockOnGesture(e) {
    // Keep first gesture synchronous for Safari
    startBgmFromGesture();
  }

  function detachUnlock() {
    if (unlockBound) return;
    unlockBound = true;
    ["touchstart", "touchend", "pointerdown", "mousedown", "keydown", "click"].forEach(
      (ev) => document.removeEventListener(ev, unlockOnGesture, true)
    );
  }

  // Capture phase so we unlock even if something stops bubbling
  ["touchstart", "touchend", "pointerdown", "mousedown", "keydown", "click"].forEach(
    (ev) => document.addEventListener(ev, unlockOnGesture, { capture: true, passive: true })
  );

  // Try autoplay on desktop; Safari mobile will stay silent until gesture
  try {
    const ctx = ensureAudio();
    if (ctx) {
      ctx.resume().then(() => {
        if (ctx.state === "running") {
          bgmStarted = true;
          startScheduler();
          detachUnlock();
        }
      }).catch(() => {});
    }
  } catch (_) {
    /* wait for gesture */
  }

  document.addEventListener("visibilitychange", () => {
    petalsPaused = document.hidden;
    if (document.hidden) {
      stopScheduler();
      if (audioCtx && audioCtx.state === "running") audioCtx.suspend();
    } else if (audioCtx && bgmStarted) {
      unlockAudioSync();
      audioCtx.resume().then(() => {
        if (audioCtx.state === "running") startScheduler();
      });
    }
  });

  /* —— Actions —— */
  const shareBtn = document.getElementById("share-btn");
  const calendarBtn = document.getElementById("calendar-btn");

  function shareText() {
    const url = window.location.href.split("#")[0];
    return (
      "You’re invited to celebrate Nissita Mangam’s first birthday!\n" +
      "Saturday, 29th August · 10:00 AM onwards\n" +
      "Cherukuri Convention, NH216, Bommuru\n" +
      "Lunch follows.\n\n" +
      "Open invitation: " +
      url
    );
  }

  function updateShareLink() {
    const text = encodeURIComponent(shareText());
    shareBtn.href = "https://wa.me/?text=" + text;
  }
  updateShareLink();

  shareBtn.addEventListener("click", async (e) => {
    updateShareLink();
    if (navigator.share) {
      e.preventDefault();
      try {
        await navigator.share({
          title: "Nissita Mangam — First Birthday",
          text: shareText(),
          url: window.location.href.split("#")[0],
        });
      } catch (_) {
        window.open(shareBtn.href, "_blank", "noopener");
      }
    }
  });

  function buildIcs() {
    // 29 Aug 2026 10:00 IST (UTC+5:30) → 04:30 UTC
    const uid = "nissita-first-birthday@" + location.hostname;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mangam Family//Nissita First Birthday//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:20260822T000000Z",
      "DTSTART:20260829T043000Z",
      "DTEND:20260829T073000Z",
      "SUMMARY:Nissita Mangam — First Birthday",
      "DESCRIPTION:Lunch follows. You are invited to celebrate!",
      "LOCATION:Cherukuri Convention\\, NH216\\, Bommuru",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    return ics;
  }

  calendarBtn.addEventListener("click", () => {
    const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nissita-first-birthday.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
})();
