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
  let petalsPaused = true; // start quiet behind seal; burst on open
  const PETAL_COUNT = 32;
  const PETAL_MAX = 140;

  const petalColors = [
    "rgba(255, 130, 160, 0.85)",
    "rgba(255, 210, 100, 0.8)",
    "rgba(255, 170, 140, 0.8)",
    "rgba(120, 200, 255, 0.7)",
    "rgba(255, 255, 255, 0.75)",
    "rgba(242, 184, 193, 0.85)",
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function makePetal(burst, origin) {
    const fromBtn = burst && origin;
    // Party-popper cone: shoot upward (±~50°) then fall
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.05;
    const force = fromBtn ? 11 + Math.random() * 16 : 0;
    return {
      x: fromBtn
        ? origin.x + (Math.random() - 0.5) * 18
        : Math.random() * window.innerWidth,
      y: fromBtn
        ? origin.y - 4
        : burst
          ? -30 - Math.random() * window.innerHeight * 0.35
          : Math.random() * -window.innerHeight,
      r: (burst ? 5 : 4) + Math.random() * (burst ? 11 : 7),
      vx: fromBtn
        ? Math.cos(angle) * force
        : -1.2 + Math.random() * 2.4,
      vy: fromBtn
        ? Math.sin(angle) * force
        : burst
          ? 2.8 + Math.random() * 4.2
          : 0.45 + Math.random() * 0.95,
      gravity: fromBtn ? 0.28 + Math.random() * 0.18 : 0,
      drift: fromBtn ? 0 : -0.4 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      spin: -0.12 + Math.random() * 0.24,
      color: petalColors[(Math.random() * petalColors.length) | 0],
      burst: !!burst,
      fromBtn: !!fromBtn,
    };
  }

  function initPetals() {
    petals = Array.from({ length: PETAL_COUNT }, () => makePetal(false));
  }

  function burstPetals(count, origin) {
    petalsPaused = false;
    const n = count || 70;
    for (let i = 0; i < n; i++) {
      petals.push(makePetal(true, origin));
    }
    if (petals.length > PETAL_MAX) {
      petals = petals.slice(petals.length - PETAL_MAX);
    }
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
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      petalRaf = requestAnimationFrame(tickPetals);
      return;
    }
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const next = [];
    for (const p of petals) {
      if (p.fromBtn) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.992;
        // soft air drag near the top so they hang then rain down
        if (p.vy > 0) p.vy *= 0.995;
      } else {
        p.y += p.vy || p.speed || 0.8;
        p.x += (p.drift || 0) + Math.sin(p.y * 0.012) * 0.45;
      }
      p.rot += p.spin;
      if (
        p.y > window.innerHeight + 30 ||
        p.x < -40 ||
        p.x > window.innerWidth + 40
      ) {
        if (p.burst) continue;
        p.y = -20;
        p.x = Math.random() * window.innerWidth;
        p.vy = 0.45 + Math.random() * 0.95;
      }
      next.push(p);
      drawPetal(p);
    }
    petals = next;
    while (petals.filter((p) => !p.burst).length < PETAL_COUNT) {
      petals.push(makePetal(false));
    }
    petalRaf = requestAnimationFrame(tickPetals);
  }

  resizeCanvas();
  initPetals();
  tickPetals();
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  /* —— Amazing Grace instrumental BGM (Safari / iOS–safe unlock) —— */
  let audioCtx = null;
  let masterGain = null;
  let bgmStarted = false;
  let nextNoteTime = 0;
  let schedulerTimer = null;

  const G3 = 196.0;
  const A3 = 220.0;
  const C4 = 261.63;
  const D4 = 293.66;
  const E4 = 329.63;
  const G4 = 392.0;
  const A4 = 440.0;
  const C3 = 130.81;
  const F3 = 174.61;
  const REST = 0;

  // Public-domain hymn — Amazing Grace (New Britain) in C
  // [freq, beats, bassRoot]
  const melody = [
    // Amazing grace, how sweet the sound
    [G3, 1, C3],
    [C4, 1.5, C3], [E4, 0.5, C3], [C4, 1, C3],
    [E4, 1, C3], [D4, 2, G3],
    [C4, 1.5, C3], [A3, 0.5, F3], [G3, 3, C3],
    // That saved a wretch like me
    [G3, 1, C3],
    [C4, 1.5, C3], [E4, 0.5, C3], [C4, 1, C3],
    [E4, 1, C3], [G4, 2, C3],
    [G4, 1.5, C3], [E4, 0.5, C3], [C4, 3, C3],
    // I once was lost, but now am found
    [C4, 1, C3],
    [E4, 1.5, C3], [G4, 0.5, C3], [E4, 1, C3],
    [G4, 1, C3], [A4, 2, F3],
    [G4, 1.5, C3], [E4, 0.5, C3], [D4, 3, G3],
    // Was blind, but now I see
    [D4, 1, G3],
    [C4, 1.5, C3], [E4, 0.5, C3], [C4, 1, C3],
    [E4, 1, C3], [D4, 2, G3],
    [C4, 1.5, C3], [A3, 0.5, F3], [G3, 2, C3], [C4, 2, C3],
    [REST, 2, 0],
  ];
  let noteIndex = 0;
  const beat = 0.3; // bright yet grateful


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

  function playTone(freq, time, dur, peak) {
    if (!audioCtx || !masterGain || !freq) return;
    const attack = Math.min(0.035, dur * 0.15);
    const amp = peak == null ? 0.7 : peak;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    rampGain(gain.gain, amp, time, attack, dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.06);

    // Bright sparkle
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, time);
    rampGain(gain2.gain, amp * 0.32, time, attack, dur);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(time);
    osc2.stop(time + dur + 0.06);

    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(freq * 3, time);
    rampGain(gain3.gain, amp * 0.1, time, attack, dur * 0.8);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(time);
    osc3.stop(time + dur + 0.06);
  }

  function playChord(root, time, dur) {
    if (!root) return;
    // Light grateful pad — higher voicing for brightness
    playTone(root * 2, time, dur, 0.1);
    playTone(root * 2.5, time, dur, 0.08);
    playTone(root * 3, time, dur, 0.06);
  }

  function scheduleNotes() {
    if (!audioCtx || audioCtx.state !== "running") return;
    const now = audioCtx.currentTime;
    if (nextNoteTime < now) nextNoteTime = now + 0.02;
    const horizon = now + 0.25;
    while (nextNoteTime < horizon + 1.5) {
      const [freq, beats, bass] = melody[noteIndex % melody.length];
      const dur = beats * beat;
      if (freq) {
        playTone(freq, nextNoteTime, dur * 0.92, 0.78);
        if (bass) {
          playChord(bass, nextNoteTime, dur * 0.95);
          playTone(bass, nextNoteTime, dur * 0.98, 0.2);
        }
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
      } else if (audioCtx.state === "running" && !schedulerTimer) {
        startScheduler();
      }
    };

    if (audioCtx.state === "running") {
      finish();
      return;
    }

    const p = audioCtx.resume();
    if (p && typeof p.then === "function") {
      p.then(finish).catch(() => {});
    }
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

  /* —— Seal: open invite + start music in same gesture —— */
  const sealGate = document.getElementById("seal-gate");
  const openBtn = document.getElementById("open-invite");

  function openInvitation(e) {
    if (e) e.preventDefault();
    if (document.body.classList.contains("is-open")) return;

    startBgmFromGesture(); // must stay in gesture stack (Safari)

    const heroVideo = document.querySelector(".hero-video");
    if (heroVideo) {
      heroVideo.muted = true;
      heroVideo.playsInline = true;
      heroVideo.play().catch(() => {});
    }

    if (sealGate) sealGate.classList.add("is-opening");

    document.body.classList.remove("is-sealed");
    document.body.classList.add("is-open");
    if (sealGate) sealGate.classList.add("is-open");

    burstPetals(85);

    setTimeout(() => {
      if (sealGate) sealGate.setAttribute("hidden", "");
    }, 650);
  }

  // Start peek video (muted) for suspense
  const peekVideo = document.querySelector(".peek-video");
  if (peekVideo) {
    peekVideo.muted = true;
    peekVideo.play().catch(() => {});
  }

  if (openBtn) {
    openBtn.addEventListener("click", openInvitation);
    openBtn.addEventListener("touchend", openInvitation, { passive: false });
  }
  if (sealGate) {
    // Whole envelope is clickable for a bigger hit target
    sealGate.querySelector(".envelope")?.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      openInvitation(e);
    });
  }

  const blessBtn = document.getElementById("bless-btn");
  const blessNote = document.getElementById("bless-note");
  const blessTotalEl = document.getElementById("bless-total");
  const BLESS_KEY = "nissita-blessings-v1";
  // Shared counter (no API key) — all guests see the same rising total
  const BLESS_GET =
    "https://abacus.jasoncameron.dev/get/nissita-birthday-invite/blessings";
  const BLESS_HIT =
    "https://abacus.jasoncameron.dev/hit/nissita-birthday-invite/blessings";

  function readLocalBlessings() {
    const n = parseInt(localStorage.getItem(BLESS_KEY) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function writeLocalBlessings(n) {
    localStorage.setItem(BLESS_KEY, String(n));
  }

  function renderBlessings(n) {
    if (blessTotalEl) {
      blessTotalEl.textContent = String(n);
      blessTotalEl.classList.remove("pop");
      // reflow for pop animation
      void blessTotalEl.offsetWidth;
      blessTotalEl.classList.add("pop");
    }
  }

  async function fetchBlessings() {
    try {
      const res = await fetch(BLESS_GET, { cache: "no-store" });
      if (!res.ok) throw new Error("counter get failed");
      const data = await res.json();
      const value = Number(data.value ?? data.count ?? 0);
      if (Number.isFinite(value)) {
        const merged = Math.max(value, readLocalBlessings());
        writeLocalBlessings(merged);
        renderBlessings(merged);
        return merged;
      }
    } catch (_) {
      /* use local */
    }
    const local = readLocalBlessings();
    renderBlessings(local);
    return local;
  }

  async function incrementBlessings() {
    // Optimistic UI so every tap feels instant
    let next = readLocalBlessings() + 1;
    renderBlessings(next);
    writeLocalBlessings(next);

    try {
      const res = await fetch(BLESS_HIT, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const value = Number(data.value ?? data.count ?? next);
        if (Number.isFinite(value)) {
          next = Math.max(value, next);
          writeLocalBlessings(next);
          renderBlessings(next);
        }
      }
    } catch (_) {
      /* local count already updated */
    }
    return next;
  }

  fetchBlessings();

  let blessTaps = 0;
  const BLESS_COLORS = [
    "#e85a7a",
    "#ff9eb5",
    "#e8b923",
    "#ffe08a",
    "#ffb3c4",
    "#fffaf7",
    "#f2b8c1",
  ];

  /** Same library/feel as the wedding invite — party-popper confetti from the button */
  function showerBlessingsFromButton(btn, taps) {
    const rect = btn.getBoundingClientRect();
    const origin = {
      x: (rect.left + rect.width / 2) / Math.max(window.innerWidth, 1),
      y: (rect.top + rect.height / 2) / Math.max(window.innerHeight, 1),
    };
    const particleCount = Math.min(50 + taps * 14, 130);

    if (typeof confetti === "function") {
      confetti({
        particleCount,
        spread: 80,
        startVelocity: 52,
        gravity: 0.85,
        ticks: 240,
        decay: 0.9,
        origin,
        colors: BLESS_COLORS,
        disableForReducedMotion: true,
      });
      // Second wave — fuller popper (wedding-style richness)
      setTimeout(() => {
        confetti({
          particleCount: Math.floor(particleCount * 0.5),
          spread: 100,
          startVelocity: 36,
          gravity: 0.95,
          ticks: 200,
          origin,
          colors: BLESS_COLORS,
          disableForReducedMotion: true,
        });
      }, 100);
    } else {
      // Fallback if CDN blocked
      burstPetals(particleCount, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }

  if (blessBtn) {
    blessBtn.style.position = "relative";
    blessBtn.addEventListener("click", (event) => {
      blessTaps += 1;
      showerBlessingsFromButton(blessBtn, blessTaps);

      // Floating +1 on the button (same pattern as wedding invite)
      const plus = document.createElement("span");
      plus.className = "floating-plus";
      plus.textContent = "+1";
      blessBtn.appendChild(plus);
      setTimeout(() => plus.remove(), 1000);

      incrementBlessings();
      if (blessNote) {
        blessNote.hidden = false;
        clearTimeout(blessNote._hideTimer);
        blessNote._hideTimer = setTimeout(() => {
          blessNote.hidden = true;
        }, 2200);
      }
    });
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
      "Saturday, 29th August · 10:30 AM onwards\n" +
      "Cherukuri Convention, NH216A, Bommuru\n" +
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
    // 29 Aug 2026 10:30 IST (UTC+5:30) → 05:00 UTC
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
      "DTSTART:20260829T050000Z",
      "DTEND:20260829T080000Z",
      "SUMMARY:Nissita Mangam — First Birthday",
      "DESCRIPTION:Lunch follows. You are invited to celebrate!",
      "LOCATION:Cherukuri Convention\\, NH216A\\, Bommuru",
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

  /* —— Countdown to 29 Aug 2026, 10:30 AM IST —— */
  const EVENT_IST_MS = Date.parse("2026-08-29T10:30:00+05:30");
  const cdRoot = document.getElementById("countdown");
  const cdDays = document.getElementById("cd-days");
  const cdHours = document.getElementById("cd-hours");
  const cdMins = document.getElementById("cd-mins");
  const cdSecs = document.getElementById("cd-secs");
  const cdLabel = cdRoot ? cdRoot.querySelector(".countdown-label") : null;

  function pad2(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function tickCountdown() {
    if (!cdDays || !cdHours || !cdMins || !cdSecs) return;
    const diff = EVENT_IST_MS - Date.now();
    if (diff <= 0) {
      cdDays.textContent = "00";
      cdHours.textContent = "00";
      cdMins.textContent = "00";
      cdSecs.textContent = "00";
      if (cdLabel) cdLabel.textContent = "The celebration has begun";
      if (cdRoot) cdRoot.classList.add("is-live");
      return;
    }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    cdDays.textContent = pad2(days);
    cdHours.textContent = pad2(hours);
    cdMins.textContent = pad2(mins);
    cdSecs.textContent = pad2(secs);
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);
})();
